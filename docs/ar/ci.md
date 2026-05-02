---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح خللًا في فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل عملية التحقق من الإصدار أو إعادة تشغيلها
    - أنت تغيّر توجيه ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط وظائف CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: خط أنابيب CI
x-i18n:
    generated_at: "2026-05-02T22:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

تشغّل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفرق وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` تحديد النطاق الذكي عن قصد وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدار فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط المعالجة

| المهمة                              | الغرض                                                                                                             | متى تعمل                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                             | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                               | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج، من دون اعتماديات، مقابل تحذيرات npm                                                    | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                                       | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip الخاص باعتماديات الإنتاج فقط، بالإضافة إلى حارس قائمة السماح للملفات غير المستخدمة                                           | تغييرات مرتبطة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة التحكم، وفحوصات القطع المبنية، والقطع القابلة لإعادة الاستخدام في المراحل اللاحقة                                 | تغييرات مرتبطة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات المضمّن/عقد Plugin/البروتوكول                                        | تغييرات مرتبطة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقد القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                                                | تغييرات مرتبطة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمضمّن، والعقود، والإضافات                                    | تغييرات مرتبطة بـ Node              |
| `check`                          | المكافئ المجزأ للبوابة المحلية الرئيسية: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، واختبار الدخان الصارم                          | تغييرات مرتبطة بـ Node              |
| `check-additional`               | أجزاء البنية، والحدود، وانحراف لقطات الموجهات، وحراس سطح الإضافات، وحدود الحزم، ومراقبة Gateway | تغييرات مرتبطة بـ Node              |
| `build-smoke`                    | اختبارات دخان CLI المبني واختبار دخان ذاكرة بدء التشغيل                                                                      | تغييرات مرتبطة بـ Node              |
| `checks`                         | أداة تحقق لاختبارات قنوات القطع المبنية                                                                           | تغييرات مرتبطة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء ودخان لتوافق Node 22                                                                          | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق التوثيق وفحصه وفحوصات الروابط المعطلة                                                                       | عند تغير التوثيق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                              | تغييرات مرتبطة بـ Skills الخاصة بـ Python      |
| `checks-windows`                 | اختبارات عمليات/مسارات خاصة بـ Windows، بالإضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة                                | تغييرات مرتبطة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام القطع المبنية المشتركة                                                         | تغييرات مرتبطة بـ macOS             |
| `macos-swift`                    | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                                      | تغييرات مرتبطة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلا النكهتين، بالإضافة إلى بناء APK تصحيح واحد                                                        | تغييرات مرتبطة بـ Android           |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                           | نجاح CI الرئيسي أو تشغيل يدوي |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات مزود وهمي، وملف تعريف عميق، وGPT 5.4 مباشر           | تشغيل مجدول ويدوي      |

## ترتيب الإخفاق السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام القطع ومصفوفة المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى تتمكن الجهات المستهلكة اللاحقة من البدء بمجرد جاهزية البناء المشترك.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تجاوزها تشغيل أحدث على أنها `cancelled` عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` حتى تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تدخل الطابور بعد أن يكون سير العمل كله قد تجاوزه تشغيل أحدث. مفتاح التزامن التلقائي لـ CI ذو إصدار (`CI-v7-*`) حتى لا يستطيع عمل عالق من جهة GitHub في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للحزمة الكاملة `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node بالإضافة إلى فحص سير العمل، لكنها لا تفرض بنفسها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات هذه المنصات محددة بتغييرات مصدر المنصة.
- **تعديلات التوجيه فقط في CI، وتعديلات تجهيزات اختبارات أساسية رخيصة محددة، وتعديلات ضيقة لمساعدات/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريعًا خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار قطع البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمّنة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدة التي تمرنها المهمة السريعة مباشرة.
- **فحوصات Node على Windows** محددة بنطاق أغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغلات npm/pnpm/UI، وإعدادات مدير الحزم، وأسطر سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin واختبارات دخان التثبيت والتغييرات الخاصة بالاختبارات فقط غير المرتبطة على مسارات Node الخاصة بـ Linux.

تُقسّم أو توازن أبطأ عائلات اختبارات Node بحيث يبقى كل عمل صغيرًا من دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتقترن مسارات وحدات النواة الصغيرة، ويعمل الرد التلقائي كأربعة عاملين متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner، والإرسال، والأوامر/توجيه الحالة)، وتوزّع إعدادات Gateway/Plugin ذات الطابع الوكيل عبر مهام Node الوكيلية الحالية الخاصة بالمصدر فقط بدلًا من انتظار القطع المبنية. تستخدم اختبارات المتصفح وQA والوسائط وPlugin المتفرقة الواسعة إعدادات Vitest المخصصة لها بدلًا من ملتقط Plugin المشترك العام. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل من جزء مفلتر. يبقي `check-additional` عمل ترجمة/كناري حدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ يشغّل جزء حارس الحدود حراسه المستقلين الصغار بالتوازي داخل مهمة واحدة، بما في ذلك `pnpm prompt:snapshots:check` حتى يُثبّت انحراف موجهات المسار الناجح في Codex إلى طلب السحب الذي سببه. تعمل مراقبة Gateway واختبارات القنوات وجزء حدود دعم النواة بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ لا يزال مسار اختبارات الوحدة الخاص بها يترجم النكهة مع علامات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف APK تصحيح مكررة في كل دفعة مرتبطة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip خاص باعتماديات الإنتاج فقط ومثبت على أحدث إصدار من Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا غير مستخدم جديدًا لم يراجع، أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات المباشرة، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

يمثل `.github/workflows/clawsweeper-dispatch.yml` الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام ملاحظة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في موجهه ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو محفوفًا بالمخاطر، أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تُشغّل عمليات إرسال CI اليدوية مخطط المهام نفسه مثل CI العادي، لكنها تُفعّل قسريًا كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء bundled-plugin، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء السريع، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، وتعريب Control UI. تُشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتُفعّل مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستبعد من CI الفحوصات الثابتة لمرحلة ما قبل إصدار Plugin، وجزء `agentic-plugins` الخاص بالإصدار فقط، والمسح الدفعي الكامل للإضافات، ومسارات Docker لمرحلة ما قبل إصدار Plugin. لا تعمل حزمة ما قبل إصدار Docker إلا عندما تُرسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى حزمة مرشح الإصدار الكاملة بسبب تشغيل push أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط على فرع أو وسم أو SHA كامل لالتزام، مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغّل                          | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المجمعة السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء `check-additional` وتجميعاتها، ومحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضًا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الوقوف في الطابور أبكر |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الإضافات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المجمعة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس للمعالج بما يكفي لأن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلفة وقت طابور 32-vCPU كانت أكبر مما وفرته)                                                                                                                                                                                                                                                                                                                     |
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

يثبّت سير العمل OCM من إصدار مثبت وKova من إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات تشخيص Kova ضد وقت تشغيل ببناء محلي مع مصادقة OpenAI-compatible وهمية وحتمية.
- `mock-deep-profile`: إعداد ملفات تعريف CPU/heap/trace لمواضع الاختناق في بدء التشغيل، وGateway، ودور agent.
- `live-gpt54`: دور agent حقيقي من OpenAI `openai/gpt-5.4`، ويُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا مجسات مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية وhook و50-plugin؛ وحلقات hello متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء CLI ضد Gateway المُشغّل. يوجد ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأً، يلتزم سير العمل أيضًا بـ `report.json` و`report.md` والحزم و`index.md` وartifacts مجس المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر الفرع الحالي باسم `openclaw-performance/<ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلي لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا لالتزام، ويرسل سير عمل `CI` اليدوي بذلك الهدف، ويرسل `Plugin Prerelease` لإثبات plugin/package/static/Docker الخاص بالإصدار فقط، ويرسل `OpenClaw Release Checks` لاختبار التثبيت السريع، وقبول الحزمة، وحزم مسار إصدار Docker، وlive/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` ضد artifact `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه ضد حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروقات الملفات الشخصية، وartifacts، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي المُغيِّر. أرسله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويرسل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويرسل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يرسل
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

يجب أن تكون مراجع إرسال سير عمل GitHub فروعًا أو وسومًا، لا SHAs خامة للالتزامات. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل محقق المظلة أيضًا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/provider الممرر إلى فحوصات الإصدار. تكون
سير عمل الإصدار اليدوية افتراضيًا على `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة provider/media الاستشارية الواسعة.

- `minimum` يبقي أسرع مسارات OpenAI/core الحرجة للإصدار.
- `stable` يضيف مجموعة provider/backend المستقرة.
- `full` يشغّل مصفوفة provider/media الاستشارية الواسعة.

تسجل المظلة معرّفات تشغيل الأطفال المُرسلة، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأطفال الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أُعيد تشغيل سير عمل فرعي وأصبح أخضر، فأعد تشغيل مهمة محقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الفرعي العادي الخاص بـ CI الكامل فقط، و`plugin-prerelease` للفرع الفرعي الخاص بالإصدار التمهيدي للـ plugin فقط، و`release-checks` لكل فرع إصدار فرعي، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. يحافظ هذا على حصر إعادة تشغيل مربع إصدار فاشل بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test` بصيغة tarball، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker الخاص بمسار الإصدار المباشر/E2E وجزء قبول الحزمة. يحافظ ذلك على اتساق بايتات الحزمة عبر مربعات الإصدار ويتجنب إعادة تحزيم المرشح نفسه في عدة مهام فرعية.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل فرعي
سبق أن أرسله عندما يُلغى الأصل، لذلك لا يبقى تحقق main الأحدث
خلف تشغيل قديم لفحوصات الإصدار مدته ساعتان. يحتفظ تحقق فرع/وسم الإصدار
ومجموعات إعادة التشغيل المركزة بـ `cancel-in-progress: false`.

## أجزاء المباشر وE2E

يحافظ فرع المباشر/E2E الخاص بالإصدار على تغطية أصلية واسعة لـ `pnpm test:live`، لكنه يشغله كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المصفاة حسب المزود
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- أجزاء وسائط صوت/فيديو مقسمة وأجزاء موسيقى مصفاة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص إخفاقات مزود المباشر البطيئة. تظل أسماء الأجزاء التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء وسائط المباشر الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ ولا تتحقق مهام الوسائط إلا من الثنائيات قبل الإعداد. أبق مجموعات اختبار المباشر المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء نموذج/واجهة المباشر الخلفية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل commit محدد. يبني سير عمل إصدار المباشر تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker المباشر وGateway المقسمة حسب المزود وواجهة CLI الخلفية وربط ACP وحزام Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل، بحيث تفشل الحاوية العالقة أو مسار التنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت هذه الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقتا فعليا على عمليات بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف tarball واحد عبر حزام Docker E2E نفسه الذي يستخدمه المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يتحقق `resolve_package` من `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما كلاهما كأثر `package-under-test`، ويطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون أرشيف tarball، ويحضّر صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلا من تحزيم نسخة سير العمل المسحوبة. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا تكون `telegram_mode` هي `none` ويثبت أثر `package-under-test` نفسه عندما يكون Package Acceptance قد حل واحدا؛ ولا يزال بإمكان إرسال Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- تقبل `source=npm` فقط `openclaw@alpha` أو `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التمهيدية/المستقرة المنشورة.
- تحزم `source=ref` فرعا موثوقا أو وسما أو SHA كاملا للـ commit من `package_ref`. يجلب محلل الحزم فروع/وسوم OpenClaw، ويتحقق من أن commit المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- تنزل `source=url` ملف `.tgz` عبر HTTPS؛ ويكون `package_sha256` مطلوبا.
- تنزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختياريا، لكن ينبغي توفيره للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزام الموثوق الذي يشغل الاختبار. `package_ref` هو commit المصدر الذي يُحزم عندما تكون `source=ref`. يتيح هذا لحزام الاختبار الحالي التحقق من commits مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف `package` التعريفي تغطية plugin غير متصلة حتى لا يكون التحقق من الحزمة المنشورة مرهونا بتوفر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع الإبقاء على مسار مواصفة npm المنشورة للإرسالات المستقلة.

للسياسة المخصصة لاختبار التحديث والـ plugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات والـ plugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=all-since-2026.4.23`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. يحافظ هذا على إثبات ترحيل الحزمة، والتحديث، وتنظيف تبعيات plugin القديمة، وإصلاح تثبيت plugin المهيأ، وplugin غير المتصل، وتحديث plugin، وTelegram على أرشيف tarball الحزمة المحلول نفسه. عيّن `package_acceptance_package_spec` في Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلا من الأثر المبني من SHA. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل والمثبت وسلوك المنصة؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بـ Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد في كل تشغيل. في Package Acceptance، يكون أرشيف tarball `package-under-test` المحلول هو المرشح دائما، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع القيمة الافتراضية `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسارات الفاشلة على ذلك الخط الأساسي. عيّن `published_upgrade_survivor_baselines=all-since-2026.4.23` لتوسيع Full Release CI عبر كل إصدار npm مستقر من `2026.4.23` حتى `latest`؛ ويظل `release-history` متاحا لأخذ عينات أوسع يدويا باستخدام مرساة ما قبل التاريخ الأقدم. عيّن `published_upgrade_survivor_scenarios=reported-issues` لتوسيع خطوط الأساس نفسها عبر تجهيزات تشبه القضايا لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw plugin المهيأة، ومسارات السجل ذات الشرطة المتموجة، وجذور تبعيات plugin القديمة العالقة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو التنظيف الشامل لتحديث منشور، لا اتساع Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق أيضا مسارات حزمة Windows والمثبت الجديدة من أن الحزمة المثبتة تستطيع استيراد تجاوز التحكم بالمتصفح من مسار Windows مطلق خام. يستخدم اختبار دخان دورة وكيل OpenAI عبر أنظمة التشغيل القيمة الافتراضية `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

لدى Package Acceptance نوافذ توافق قديم محدودة للحزم المنشورة مسبقا. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من أرشيف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تكشف الحزمة ذلك العلم؛
- قد يقلم `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من تجهيز git المزيف المشتق من أرشيف tarball وقد يسجل غياب `update.channel` المستمر؛
- قد تقرأ اختبارات دخان plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات التكوين الوصفية مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا من ملفات ختم بيانات وصفية للبناء المحلي كانت قد شُحنت بالفعل. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار تثبيت سريع

يعيد سير العمل المنفصل `Install Smoke` استخدام نص النطاق نفسه من خلال مهمة `preflight` الخاصة به. وهو يقسم تغطية الاختبار السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزم/بيانات Plugin المضمنة، أو أسطح Plugin/channel/gateway/Plugin SDK الأساسية التي تمرنها مهام اختبار Docker السريع. تغييرات Plugin المضمنة الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط لا تحجز عمّال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويتحقق من CLI، ويشغل اختبار CLI السريع لحذف الوكلاء لمساحة العمل المشتركة، ويشغل e2e لشبكة Gateway في الحاوية، ويتحقق من وسيطة بناء امتداد مضمن، ويشغل ملف تعريف Docker المحدود للـ Plugin المضمنة ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke صورة اختبار سريع لصورة Dockerfile الجذر في GHCR لعنوان SHA المستهدف أو يعيد استخدامها، ثم يشغل تثبيت حزمة QR، واختبارات Dockerfile/Gateway الجذر، واختبارات المثبّت/التحديث، وDocker E2E السريع للـ Plugin المضمنة كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف اختبارات صورة الجذر.

دفعات `main` (بما فيها commits الدمج) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يبقي سير العمل اختبار Docker السريع ويترك اختبار التثبيت السريع الكامل للتحقق الليلي أو تحقق الإصدار.

اختبار مزود الصور لتثبيت Bun العمومي البطيء محكوم على نحو منفصل عبر `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن للتشغيلات اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقا صورة اختبار مباشر مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف tarball من npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git عار لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويوجد منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### خيارات الضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات المباشرة المتزامنة حتى لا يخنق المزودون الطلبات.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تباعد بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم وجود تباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات مباشرة/ذيل محددة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى تنظيف الاختبار السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعال أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تنفذ التجميعة المحلية فحوصات تمهيدية لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل مباشر/E2E قابل لإعادة الاستخدام

يسأل سير العمل المباشر/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة المباشرة والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل artifact حزمة من التشغيل الحالي، أو ينزل artifact حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية في GHCR الموسومة ببصمة الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات ذات حزمة مثبتة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور بصمة الحزمة الموجودة بدلا من إعادة البناء. يعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعا تدفق registry/cache العالق بدلا من استهلاك معظم المسار الحرج لـ CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار عبر مهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` ومن `plugins-runtime-install-a` إلى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/runtime. ويبقى اسم المسار المستعار `install-e2e` اسم إعادة التشغيل اليدوي التجميعي لكلا مساري مثبّت المزود.

يدمج OpenWebUI في `plugins-runtime-services` عندما تطلبه تغطية مسار الإصدار الكاملة، ويحتفظ بجزء مستقل `openwebui` فقط للتشغيلات الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمنة المحاولة مرة واحدة عند فشل شبكة npm العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل مدخل `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المعدة بدلا من مهام الأجزاء، ما يبقي تصحيح المسار الفاشل محدودا في مهمة Docker موجهة واحدة ويجهز أو ينزل أو يعيد استخدام artifact الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسارا مباشرا في Docker، تبني المهمة الموجهة صورة الاختبار المباشر محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل في GitHub المولدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المعدة عندما تكون هذه القيم موجودة، حتى يستطيع المسار الفاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل المباشر/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## Plugin Prerelease

`Plugin Prerelease` تغطية منتج/حزمة أعلى تكلفة، لذلك هو سير عمل منفصل يطلقه `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية ودفعات `main` والتشغيلات اليدوية المستقلة لـ CI تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمنة عبر ثمانية عمّال امتدادات؛ تشغّل مهام أجزاء الامتدادات هذه ما يصل إلى مجموعتي إعدادات Plugin في كل مرة مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker لما قبل الإصدار الخاص بالإصدار مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام مدتها من دقيقة إلى ثلاث دقائق.

## مختبر QA

يملك مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. تكافؤ الوكلاء متداخل ضمن حزم QA والإصدار الواسعة، وليس سير عمل PR مستقلا. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي للتكافؤ أن يسير مع تشغيل تحقق واسع.

- يشغل سير العمل `QA-Lab - All Lanes` ليليا على `main` وعند التشغيل اليدوي؛ ويوسع مسار التكافؤ الوهمي، ومسار Matrix المباشر، ومساري Telegram وDiscord المباشرين كمهام متوازية. تستخدم المهام المباشرة بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغل فحوصات الإصدار مساري نقل Matrix وTelegram المباشرين مع المزود الوهمي الحتمي والنماذج المؤهلة وهميا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يعزل عقد القناة عن زمن استجابة النموذج المباشر وبدء Plugin المزود العادي. يعطل Gateway النقل المباشر بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة على نحو منفصل؛ وتغطي الاتصال بالمزود مجموعات النموذج المباشر والمزود الأصلي ومزود Docker المنفصلة.

تستخدم Matrix ‏`--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمها CLI المحدد. تبقى القيمة الافتراضية لـ CLI ومدخل سير العمل اليدوي `all`؛ تشغيل `matrix_profile=all` اليدوي يقسم دائما تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغل `OpenClaw Release Checks` أيضا مسارات مختبر QA الحرجة للإصدار قبل موافقة الإصدار؛ تشغل بوابة تكافؤ QA الخاصة به حزم المرشح والأساس كمهام مسارات متوازية، ثم تنزل كلا الـ artifacts في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى طلبات السحب العادية، اتبع أدلة CI/الفحوصات ذات النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

يركّز سير عمل `CodeQL` عمدًا على كونه ماسح أمان أوليًّا ضيق النطاق، وليس مسحًا شاملًا للمستودع بأكمله. تفحص عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمان عالية الثقة مفلترة إلى `security-severity` مرتفع/حرج.

تبقى حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وبيئة العزل، وcron، وخط أساس Gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط لمس التدقيق                  |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                        |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android مجدول. يبني تطبيق Android يدويًا لأجل CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. يرفع ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لأجل CodeQL على Blacksmith macOS، ويصفّي نتائج بناء التبعيات من SARIF المرفوع، ويرفع ضمن `/codeql-critical-security/macos`. يُبقى خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبخطورة أخطاء على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة به أصغر عمدًا من الملف المجدول: طلبات السحب غير المسودة تشغّل فقط أجزاء `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة عند تغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، أو كود مخطط/ترحيل/إدخال وإخراج الإعدادات، أو كود المصادقة/الأسرار/بيئة العزل/الأمان، أو وقت تشغيل القناة الأساسية وPlugin القناة المضمّن، أو بروتوكول Gateway/طريقة الخادم، أو وقت تشغيل الذاكرة/لصق SDK، أو MCP/العملية/التسليم الصادر، أو وقت تشغيل المزوّد/كتالوج النماذج، أو تشخيصات الجلسة/طوابير التسليم، أو محمّل Plugin، أو Plugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغّل كل أجزاء جودة طلب السحب الاثني عشر.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي نقاط تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                   | السطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، والأسرار، وبيئة العزل، وcron، وGateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال والإخراج                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّن                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النموذج/المزوّد، وإرسال الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات إشراف العمليات، وعقود التسليم الصادر                                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، ولصق تفعيل وقت تشغيل الذاكرة، وأوامر doctor للذاكرة                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزمة أحداث/سجلات التشخيص، وعقود CLI الخاصة بـ doctor للجلسات             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الردود، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضيات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                         |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل جلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                          |
| `/codeql-critical-quality/plugin-boundary`              | عقود نقطة دخول المحمّل، والسجل، والسطح العام، وPlugin SDK                                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                                    |

تبقى الجودة منفصلة عن الأمان لكي يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL لـ Swift وPython وPlugins المضمّنة كعمل لاحق محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الضيقة مستقرة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت حديثًا. لا يملك جدولًا صرفًا: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يفعّله، ويمكن للتشغيل اليدوي أن يشغّله مباشرة. تتخطى استدعاءات workflow-run عندما يكون `main` قد تقدّم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أُنشئ خلال الساعة الماضية. عندما يعمل، يراجع نطاق الالتزامات من SHA مصدر `Docs Agent` السابق غير المتخطى إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. لا يملك جدولًا صرفًا: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد شُغّل بالفعل أو قيد التشغيل في ذلك اليوم حسب UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمّعًا لكامل الحزمة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير كامل الحزمة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط ويجب أن ينجح تقرير كامل الحزمة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع البوت، يعيد المسار تطبيق التصحيح المتحقق منه فوقه، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ أما التصحيحات القديمة المتعارضة فتُتخطى. يستخدم Ubuntu المستضاف على GitHub حتى يستطيع إجراء Codex الحفاظ على وضع السلامة نفسه بإسقاط sudo كما في وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يضبط افتراضيًا على التشغيل الجاف ولا يغلق إلا طلبات السحب المذكورة صراحة عندما يكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدموج وأن كل تكرار يملك إما قضية مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطق مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتُنفّذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بخصوص حدود البنية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغّل فحص أنواع الإنتاج الأساسي وفحص أنواع اختبارات الأساس إضافة إلى lint/الحراس الأساسيين؛
- تغييرات الاختبارات الأساسية فقط تشغّل فقط فحص أنواع اختبارات الأساس إضافة إلى lint الأساسي؛
- تغييرات إنتاج الإضافات تشغّل فحص أنواع إنتاج الإضافات واختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات اختبارات الإضافات فقط تشغّل فحص أنواع اختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات Plugin SDK العام أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على تلك العقود الأساسية (تبقى عمليات مسح إضافات Vitest عمل اختبار صريحًا)؛
- زيادات الإصدار الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوصات إصدار/إعدادات/تبعية جذر مستهدفة؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتعديلات المصدر تفضّل التعيينات الصريحة، ثم اختبارات الأشقاء والاعتمادات في رسم الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد التعيينات الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجّه مطالبة نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى تفشل تغييرات افتراض مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا على مستوى الحاضنة بما يكفي لجعل المجموعة المعيّنة الرخيصة وكيلًا غير موثوق.

## تحقق Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا مُحمّى مسبقًا للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 عملية حذف لملفات متتبعة. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وحمِّ صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات عمليات الحذف الكبيرة المقصودة، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذاك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق بدون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة بشكل غير معتاد.

Crabbox هو مسار الصندوق البعيد الثاني المملوك للمستودع لإثبات Linux عندما لا يكون Blacksmith متاحًا أو عندما تكون سعة السحابة المملوكة مفضلة. حمِّ صندوقًا، واملأه عبر سير عمل المشروع، ثم شغّل الأوامر عبر Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

تمتلك `.crabbox.yaml` الإعدادات الافتراضية للمزوّد والمزامنة وملء GitHub Actions. وهي تستثني `.git` المحلي بحيث يحتفظ checkout المملوء من Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة مستودعات remotes ومخازن objects المحلية الخاصة بالمشرف، وتستثني مصنوعات وقت التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. تمتلك `.github/workflows/crabbox-hydrate.yml` إعداد checkout وNode/pnpm وجلب `origin/main` وتسليم البيئة غير السرية التي تستوردها لاحقًا أوامر `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

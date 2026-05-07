---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تعمل على تحرّي خلل في فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل عملية التحقق من صحة الإصدار أو إعادة تشغيلها
    - أنت تغيّر آلية إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: رسم بياني لمهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-05-07T01:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI يعمل عند كل دفع إلى `main` وعلى كل طلب سحب. تصنّف مهمة `preflight` الفرق وتوقف المسارات المكلفة عندما لا تتغير إلا مناطق غير مرتبطة. تتجاوز عمليات `workflow_dispatch` اليدوية عمدًا تحديد النطاق الذكي وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                            | الغرض                                                                                                      | متى تعمل                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، وPlugin المتغيرة، وبناء بيان CI                           | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`               | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                       | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`       | تدقيق ملف قفل الإنتاج، بلا تبعيات، مقابل تنبيهات npm                                                       | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-fast`                   | تجميع مطلوب لمهام الأمان السريعة                                                                           | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`              | تمريرة Knip الخاصة بتبعيات الإنتاج فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                 | التغييرات المرتبطة بـ Node         |
| `build-artifacts`                 | بناء `dist/` وواجهة التحكم، وفحوصات نواتج البناء، ونواتج قابلة لإعادة الاستخدام لاحقًا                   | التغييرات المرتبطة بـ Node         |
| `checks-fast-core`                | مسارات صحة Linux السريعة مثل فحوصات Plugin المضمّنة/عقد Plugin/البروتوكول                                  | التغييرات المرتبطة بـ Node         |
| `checks-fast-contracts-channels`  | فحوصات عقود القنوات المقسمة مع نتيجة فحص تجميعية مستقرة                                                    | التغييرات المرتبطة بـ Node         |
| `checks-node-core-test`           | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمضمّنة، والعقود، وPlugin                         | التغييرات المرتبطة بـ Node         |
| `check`                           | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والLint، والحراس، وأنواع الاختبارات، وsmoke الصارم | التغييرات المرتبطة بـ Node         |
| `check-additional`                | المعمارية، وانحراف الحدود/المطالبات المقسم، وحراس Plugin، وحدود الحزم، ومراقبة Gateway                    | التغييرات المرتبطة بـ Node         |
| `build-smoke`                     | اختبارات smoke لواجهة CLI المبنية وsmoke ذاكرة بدء التشغيل                                                 | التغييرات المرتبطة بـ Node         |
| `checks`                          | أداة تحقق لاختبارات قنوات نواتج البناء                                                                     | التغييرات المرتبطة بـ Node         |
| `checks-node-compat-node22`       | مسار بناء وsmoke للتوافق مع Node 22                                                                        | تشغيل CI يدوي للإصدارات           |
| `check-docs`                      | تنسيق التوثيق، وLint، وفحوصات الروابط المعطلة                                                              | عند تغير التوثيق                  |
| `skills-python`                   | Ruff + pytest للـ Skills المدعومة بـ Python                                                                | التغييرات المرتبطة بـ Skills Python |
| `checks-windows`                  | اختبارات عمليات/مسارات خاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة              | التغييرات المرتبطة بـ Windows      |
| `macos-node`                      | مسار اختبارات TypeScript على macOS باستخدام نواتج البناء المشتركة                                          | التغييرات المرتبطة بـ macOS        |
| `macos-swift`                     | Swift lint والبناء والاختبارات لتطبيق macOS                                                                | التغييرات المرتبطة بـ macOS        |
| `android`                         | اختبارات وحدة Android للنكهتين إضافة إلى بناء debug APK واحد                                               | التغييرات المرتبطة بـ Android      |
| `test-performance-agent`          | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                          | نجاح CI الرئيسي أو تشغيل يدوي      |
| `openclaw-performance`            | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات موفر وهمي، وملف تعريف عميق، وGPT 5.4 مباشر           | تشغيل مجدول ويدوي                 |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات توجد أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام نواتج البناء ومصفوفات المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يستطيع المستهلكون اللاحقون البدء فور جاهزية البناء المشترك.
4. تتوسع بعد ذلك مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات التجميع للأجزاء `!cancelled() && always()` حتى تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل كله قد تم تجاوزه بالفعل. مفتاح تزامن CI التلقائي ذي إصدار (`CI-v7-*`) حتى لا تستطيع عملية عالقة من جهة GitHub في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

ترفع مهمة `ci-timings-summary` ناتجًا مضغوطًا باسم `ci-timings-summary` لكل تشغيل CI غير مسودة. يسجل زمن الحائط، وزمن الطابور، وأبطأ المهام، والمهام الفاشلة للتشغيل الحالي، حتى لا تحتاج فحوصات صحة CI إلى كشط حمولة Actions الكاملة مرارًا.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف نطاق التغييرات ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى Lint لسير العمل، لكنها لا تفرض وحدها بناءات Windows أو Android أو macOS الأصلية؛ تبقى تلك المسارات المنصية محصورة في تغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات اختبارات النواة الرخيصة المحددة، وتعديلات مساعدين/توجيه اختبارات عقود Plugin الضيقة** تستخدم مسار بيان سريع خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار نواتج البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمّنة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعدين التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محصورة في أغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغلات npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى التغييرات غير المرتبطة في المصدر وPlugin وinstall-smoke والاختبارات فقط على مسارات Linux Node.

تقسم عائلات اختبارات Node الأبطأ أو توازن بحيث تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتعمل مسارات وحدات النواة السريعة/الدعم بشكل منفصل، وتقسم بنية وقت تشغيل النواة بين الحالة، والعملية/التكوين، وcron، والأجزاء المشتركة، ويعمل الرد التلقائي كعاملين متوازنين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتقسم تكوينات gateway/server الوكيلة عبر مسارات chat/auth/model/http-plugin/runtime/startup بدل الانتظار على نواتج البناء. تستخدم اختبارات المتصفح، وQA، والوسائط، وPlugin المتنوعة الواسعة تكوينات Vitest المخصصة لها بدل الالتقاط العام المشترك لـ Plugin. تسجل أجزاء أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، حتى يستطيع `.artifacts/vitest-shard-timings.json` تمييز تكوين كامل من جزء مصفى. يبقي `check-additional` عمل تجميع/كناري حدود الحزم معًا ويفصل معمارية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُقسّم قائمة حراس الحدود عبر أربعة أجزاء مصفوفة، يشغل كل منها حراسًا مستقلة محددة بالتزامن ويطبع توقيتات لكل فحص. يعمل فحص انحراف لقطة مطالبات مسار Codex السعيد المكلف في CI اليدوي وللتغييرات المؤثرة في المطالبات فقط، حتى لا تنتظر تغييرات Node العادية غير المرتبطة خلف توليد بارد للقطات المطالبات بينما يبقى انحراف المطالبة مثبتًا بطلب السحب الذي تسبب به؛ تتجاوز الراية نفسها توليد Vitest للقطات المطالبات داخل جزء حدود دعم النواة لنواتج البناء. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم النواة بالتزامن داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ ما يزال مسار اختبارات الوحدة الخاص بها يترجم النكهة مع رايات BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف debug APK مكررة عند كل دفعة مرتبطة بـ Android.

يشغل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip خاص بتبعيات الإنتاج فقط ومثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات المباشرة، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر على جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب ولا ينفذ كود طلبات سحب غير موثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يملك سير العمل أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستلم في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، وينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام للمراقبة، وليس للتسليم افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو محفوفًا بالمخاطر، أو مفيدًا تشغيليًا. ينبغي أن تؤدي الفتحات والتعديلات الروتينية، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامَل مع عناوين GitHub وتعليقاته ومحتويات نصوصه ونص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة في هذا المسار كله. إنها مُدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام كما في CI العادي، لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugins المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وتدويل Control UI. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتفعّل مظلة الإصدار الكامل Android عبر تمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومسح دفعات الامتدادات الكامل، ومسارات Docker لما قبل إصدار Plugin. لا تعمل مجموعة Docker لما قبل الإصدار إلا عندما تشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة بحيث لا تُلغى مجموعة الإصدار المرشح الكاملة بسبب عملية دفع أخرى أو تشغيل PR على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني على فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمّن السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء الفحص البرمجي، وتجميعات `check-additional`، ومدققات تجميع اختبارات Node، وفحوصات التوثيق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الامتدادات الأخف وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المضمّن، وأجزاء `check-additional`، و`android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس للمعالج بما يكفي لأن 8 vCPU كلفت أكثر مما وفّرت)؛ وبناءات Docker الخاصة بـ install-smoke (وقت انتظار صف 32-vCPU كلف أكثر مما وفّر)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود الفروع المشتقة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود الفروع المشتقة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

يبقي CI في المستودع المعياري Blacksmith كمسار المشغّل الافتراضي. أثناء `preflight`، يتحقق `scripts/ci-runner-labels.mjs` من عمليات Actions الحديثة المصطفة وقيد التنفيذ بحثا عن مهام Blacksmith المصطفة. إذا كانت هناك مهام مصطفة بالفعل لتسمية Blacksmith محددة، فإن المهام اللاحقة التي كانت ستستخدم تلك التسمية نفسها تعود إلى المشغّل المطابق المستضاف على GitHub (`ubuntu-24.04` أو `windows-2025` أو `macos-latest`) لذلك التشغيل فقط. تبقى أحجام Blacksmith الأخرى ضمن عائلة نظام التشغيل نفسها على تسمياتها الأساسية. إذا فشل فحص API، فلا يُطبَّق أي رجوع احتياطي.

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

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميا على `main` ويمكن تشغيله يدويا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس التشغيل اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبّت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات تشخيص Kova مقابل وقت تشغيل ببناء محلي مع مصادقة مزيفة حتمية ومتوافقة مع OpenAI.
- `mock-deep-profile`: توصيف أداء CPU/heap/trace لنقاط سخونة بدء التشغيل، وGateway، ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI حقيقية `openai/gpt-5.4`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحا.

يشغّل مسار mock-provider أيضا مجسات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية وhook و50-Plugin؛ وحلقات hello متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، وبجانبه JSON الخام.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ، يلتزم سير العمل أيضا بـ `report.json` و`report.md` والحزم و`index.md` وartifacts مجس المصدر إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّة لعبارة "شغّل كل شيء قبل الإصدار." يقبل فرعا أو وسما أو SHA التزام كامل، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تُبقي عمليات التشغيل المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية soak تلك بحيث يبقى التحقق الاستشاري الواسع واسعا. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضا `NPM Telegram Beta E2E` مقابل artifact `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) من أجل
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، وartifacts،
ومقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُجري تغييرات. شغّله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد npm الخاص بـ OpenClaw. يتحقق من `pnpm plugins:sync:check`،
ويشغّل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغّل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغّل
`OpenClaw NPM Release` مع `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات الالتزام المثبّت على فرع سريع التغيّر، استخدم المساعد بدلاً من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعاً أو وسوماً، لا قيم SHA خاماً للالتزامات. يدفع
المساعد فرعاً مؤقتاً باسم `release-ci/<sha>-...` عند SHA الهدف،
ويشغّل `Full Release Validation` من ذلك المرجع المثبّت، ويتحقق من أن كل
سير عمل فرعي يطابق `headSha` فيه الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. ويفشل المتحقق الجامع أيضاً إذا كان أي سير عمل فرعي قد شُغّل عند
SHA مختلف.

يتحكم `release_profile` في اتساع اختبارات live/المزوّدين الممرّرة إلى فحوصات الإصدار. تكون
تدفقات عمل الإصدار اليدوية افتراضياً على `stable`؛ استخدم `full` فقط عندما
تريد عمداً مصفوفة المزوّدين/الوسائط الاستشارية الواسعة. يتحكم `run_release_soak`
في ما إذا كانت فحوصات الإصدار stable/الافتراضية تشغّل فحص التحمل live/E2E الشامل ومسار إصدار
Docker؛ يفرض `full` تشغيل فحص التحمل.

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّدين/الخلفيات المستقرة.
- يشغّل `full` مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

يسجّل الجامع معرّفات التشغيل الفرعية التي شُغّلت، وتعيد مهمة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أُعيد تشغيل سير عمل فرعي وتحول إلى ناجح، فأعد تشغيل مهمة المتحقق الأصلية فقط لتحديث نتيجة الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الفرعي العادي الكامل CI فقط، و`plugin-prerelease` للفرع الفرعي prerelease الخاص بـ plugin فقط، و`release-checks` لكل فروع الإصدار الفرعية، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الجامع. يحافظ هذا على إعادة تشغيل صندوق إصدار فاشل ضمن حدود بعد إصلاح مركّز. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثلاً `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات QA release-check استشارية، لذلك فإن إخفاقات QA فقط تحذّر ولا تحظر متحقق release-check.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى حزمة tarball باسم `release-package-under-test`، ثم يمرّر ذلك الأثر إلى فحوصات cross-OS وPackage Acceptance، إضافة إلى سير عمل Docker live/E2E لمسار الإصدار عند تشغيل تغطية التحمل. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تتجاوز الجامع الأقدم. يلغي مراقب الأصل أي سير عمل فرعي كان قد شغّله بالفعل
عندما يُلغى الأصل، لذلك لا يبقى تحقق main الأحدث خلف تشغيل release-check قديم
مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## شرائح Live وE2E

يحافظ الفرع الفرعي live/E2E للإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشرائح مسماة عبر `scripts/test-live-shard.mjs` بدلاً من مهمة تسلسلية واحدة:

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
- شرائح وسائط صوت/فيديو مقسمة وشرائح موسيقى مفلترة حسب المزوّد

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص إخفاقات مزوّدي live البطيئة. تبقى أسماء الشرائح التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شرائح وسائط live الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبّت تلك الصورة مسبقاً `ffmpeg` و`ffprobe`؛ ولا تتحقق مهام الوسائط إلا من وجود الثنائيات قبل الإعداد. أبقِ مجموعات live المدعومة بـ Docker على مشغّلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker متداخلة.

تستخدم شرائح نموذج/خلفية live المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل إصدار live تلك الصورة ويدفعها مرة واحدة، ثم تعمل شرائح نموذج Docker live، وGateway المقسّم حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شرائح Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل، بحيث يفشل مسار حاوية عالق أو مسار تنظيف بسرعة بدلاً من استهلاك ميزانية release-check كلها. إذا أعادت تلك الشرائح بناء هدف Docker الكامل للمصدر بشكل مستقل، فإن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقتاً على بناء صور مكرر.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` قيمة `workflow_ref`، ويحل مرشح حزمة واحداً، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما كأثر `package-under-test`، ويطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف الشخصي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويحضّر صور Docker ذات ملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلاً من حزم checkout الخاص بسير العمل. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يحضّر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزّع تلك المسارات كمهام Docker مستهدفة متوازية بآثار فريدة.
3. تستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. تعمل عندما لا تكون `telegram_mode` هي `none` وتثبت أثر `package-under-test` نفسه عندما يكون Package Acceptance قد حل واحداً؛ ولا يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول prerelease/stable المنشور.
- يحزم `source=ref` فرع `package_ref` أو وسمه أو SHA التزاماً كاملاً موثوقاً. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من تاريخ فروع المستودع أو من وسم إصدار، ويثبت الاعتماديات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف HTTPS بصيغة `.tgz`؛ تكون `package_sha256` مطلوبة.
- ينزّل `source=artifact` ملف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي توفيرها للآثار المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يُحزم عند `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية plugin دون اتصال، بحيث لا يكون تحقق الحزمة المنشورة مشروطاً بتوافر ClawHub live. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

للسياسة المخصصة لاختبار التحديث وplugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يحافظ ذلك على إثبات ترحيل الحزمة، والتحديث، وتنظيف اعتماديات plugin القديمة، وإصلاح تثبيت plugin المهيّأ، وplugin دون اتصال، وplugin-update، وTelegram على tarball الحزمة المحلول نفسه. اضبط `package_acceptance_package_spec` على Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلاً من الأثر المبني من SHA. لا تزال فحوصات إصدار cross-OS تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة؛ يجب أن يبدأ تحقق منتج الحزمة/التحديث من Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاظر. في Package Acceptance، يكون tarball `package-under-test` المحلول هو المرشح دائماً، وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، وافتراضياً `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق plugin المثبّتة ومثبتات على شكل قضايا لإعداد Feishu وملفات bootstrap/persona المحفوظة وتثبيتات OpenClaw plugin المهيأة ومسارات السجل بعلامة tilde وجذور اعتماديات plugin القديمة الراكدة. تُقسّم اختيارات multi-baseline published-upgrade survivor حسب خط الأساس إلى مهام Docker runner مستهدفة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال عن تنظيف التحديث المنشور الشامل، لا عن اتساع Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد مع `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مخبوزة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق أيضاً مسارات Windows المعبأة والمثبت الجديد من أن حزمة مثبتة يمكنها استيراد تجاوز browser-control من مسار Windows خام مطلق. يكون OpenAI cross-OS agent-turn smoke افتراضياً على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

لقبول الحزمة نوافذ توافق قديمة محدودة للحزم المنشورة مسبقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية الخاصة باستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` إدخالات `pnpm.patchedDependencies` المفقودة من تجهيز git الوهمي المشتق من tarball، وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات التحقق السريعة من Plugin مواقع سجلات التثبيت القديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت بلا تغيير.

قد تصدر حزمة `2026.4.26` المنشورة أيضا تحذيرا بخصوص ملفات طابع بيانات تعريف البناء المحلية التي سبق شحنها. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثاره الخاصة بـ Docker: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار تثبيت سريع

يعيد سير العمل المنفصل `Install Smoke` استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. وهو يقسم تغطية التحقق السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزمة، أو تغييرات حزمة/manifest الخاصة بـ Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام التحقق السريع من Docker. تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات المستندات فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغل اختبار CLI السريع لحذف مساحة العمل المشتركة للوكلاء، ويشغل اختبار e2e لشبكة Gateway داخل الحاوية، ويتحقق من وسيطة بناء إضافة مضمّنة، ويشغل ملف تعريف Docker المحدود الخاص بـ Plugin المضمّن ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- **المسار الكامل** يحتفظ بتثبيت حزمة QR وتغطية Docker/التحديث الخاصة بالمثبت للتشغيلات الليلية المجدولة، وعمليات الإرسال اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلا أسطح المثبت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke صورة تحقق سريع من Dockerfile الجذري في GHCR عند SHA الهدف أو يعيد استخدامها، ثم يشغل تثبيت حزمة QR، واختبارات Dockerfile/Gateway الجذرية، واختبارات المثبت/التحديث، وDocker E2E السريع الخاص بـ Plugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبت خلف اختبارات الصورة الجذرية السريعة.

لا تفرض دفعات `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق النطاق المتغير تغطية كاملة عند الدفع، يبقي سير العمل اختبار Docker السريع ويترك اختبار التثبيت السريع الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع اختبار مزود صورة تثبيت Bun العام البطيء بشكل منفصل لـ `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات الإرسال اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل. تحتفظ اختبارات QR وDocker الخاصة بالمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة مسبقا، ويغلف OpenClaw مرة واحدة كملف npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### عناصر قابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تقوم المزودات بالاختناق.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التباعد بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم وجود تباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيلية محددة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معين   | يطبع `1` خطة المجدول من دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معين   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى اختبار التنظيف السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار واحد فاشل. |

يمكن لمسار أثقل من حده الفعال أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تنفذ التجميعة المحلية فحوصات Docker التمهيدية، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة الحية والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. وهو إما يغلف OpenClaw من خلال `scripts/package-openclaw-for-docker.mjs`، أو ينزل أثر حزمة من التشغيل الحالي، أو ينزل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية في GHCR الموسومة بملخص الحزمة من خلال ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلا من إعادة البناء. تعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد بسرعة تدفق registry/ذاكرة تخزين مؤقت عالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية لـ Plugin/وقت التشغيل. ويبقى الاسم المستعار للمسار `install-e2e` اسما مستعارا تجميعيا لإعادة التشغيل اليدوية لكلا مساري مثبت المزود.

يدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكامل ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل شبكة npm عابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات والتوقيتات و`summary.json` و`failures.json` وتوقيتات المراحل وJSON خطة المجدول وجداول المسارات البطيئة وأوامر إعادة التشغيل لكل مسار. يشغل مدخل سير العمل `docker_lanes` المسارات المحددة على الصور المجهزة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدودا بمهمة Docker واحدة موجهة ويجهز أو ينزل أو يعيد استخدام أثر الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسارا حيا في Docker، تبني المهمة الموجهة صورة الاختبار الحي محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل المولدة لكل مسار في GitHub كلا من `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المجهزة عند وجود تلك القيم، بحيث يمكن لمسار فاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` تغطية منتج/حزمة أعلى كلفة، لذلك فهو سير عمل منفصل يرسله `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية ودفعات `main` وعمليات إرسال CI اليدوية المستقلة تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمّن عبر ثمانية عمال للإضافات؛ تشغل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي إعدادات Plugin في الوقت نفسه، مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker للإصدار التمهيدي الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها دقيقة إلى ثلاث دقائق.

## مختبر QA

يملك مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. تندرج المساواة الوكيلة تحت أدوات QA والإصدار الواسعة، وليست سير عمل مستقل لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن تسير المساواة مع تشغيل تحقق واسع.

- يشغل سير العمل `QA-Lab - All Lanes` ليليا على `main` وعند الإرسال اليدوي؛ وينشر مسار المساواة الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تُشغّل فحوص الإصدار مسارات النقل الحي في Matrix وTelegram مع موفّر المحاكاة الحتمي والنماذج المؤهلة للمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يكون عقد القناة معزولًا عن زمن استجابة النموذج الحي وبدء التشغيل العادي لـPlugin المزوّد. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات الاختبار المنفصلة للنموذج الحي والمزوّد الأصلي ومزوّد Docker اتصال المزوّد.

يستخدم Matrix الخيار `--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI الذي تم سحبه ذلك. تبقى قيمة CLI الافتراضية وإدخال سير العمل اليدوي `all`؛ ويؤدي تشغيل `matrix_profile=all` اليدوي دائمًا إلى تجزئة تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات QA Lab الحرجة للإصدار قبل اعتماد الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تُنزّل كلا الأثرين إلى مهمة تقرير صغيرة لإجراء مقارنة التكافؤ النهائية.

بالنسبة إلى PRs العادية، اتبع أدلة CI/الفحص محددة النطاق بدلًا من اعتبار التكافؤ حالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو ماسح أمني ضيق للمرور الأول عن قصد، وليس مسحًا كاملًا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافةً إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمنية عالية الثقة مصفّاة إلى `security-severity` مرتفع/حرج.

تبقى حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات تحت `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها التي يشغّلها سير العمل المجدول. يبقى CodeQL الخاص بـAndroid وmacOS خارج الإعدادات الافتراضية لـPR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وبيئة العزل، وcron، وخط أساس Gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافةً إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                 |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                         |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android مجدول. يبني تطبيق Android يدويًا لـCodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة سير العمل. يرفع النتائج تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لـCodeQL على Blacksmith macOS، ويصفّي نتائج بناء الاعتماديات من SARIF المرفوع، ويرفع النتائج تحت `/codeql-critical-security/macos`. يبقى خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة به أصغر عمدًا من الملف المجدول: تشغّل PRs غير المسودة فقط الأجزاء المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/بيئة العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّن، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/وصل SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وعقد Plugin SDK/الحزمة، أو تغييرات وقت تشغيل رد Plugin SDK. تشغّل تغييرات إعداد CodeQL وسير عمل الجودة كل أجزاء جودة PR الاثني عشر.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي نقاط تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                   | السطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود الأمان للمصادقة، والأسرار، وبيئة العزل، وcron، وGateway                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال/الإخراج                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّن                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت التشغيل لتنفيذ الأوامر، وإرسال النماذج/المزوّدين، وإرسال الرد التلقائي وطوابيره، ومستوى التحكم ACP                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، والأسماء المستعارة لذاكرة Plugin SDK، ووصل تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزمة أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسة                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الردود، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/المؤشر                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضيات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                         |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت التشغيل لجلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                        |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور في جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                                   |

تبقى الجودة منفصلة عن الأمان بحيث يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL لـSwift وPython وPlugin المضمّن كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الضيقة مستقرة في زمن التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت مؤخرًا. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أُنشئ خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ`Docs Agent` إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يطلقه، لكنه يتخطى إذا كان استدعاء آخر عبر تشغيل سير العمل قد عمل أو يعمل بالفعل في ذلك اليوم وفق UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعًا للمجموعة الكاملة، ويسمح لـCodex بإجراء إصلاحات أداء صغيرة فقط للاختبارات مع الحفاظ على التغطية بدلًا من عمليات إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان في خط الأساس اختبارات فاشلة، يجوز لـCodex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع الروبوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ وتُتخطى الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع أمان إسقاط sudo نفسه مثل وكيل المستندات.

### PRs المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. قيمته الافتراضية هي التشغيل الجاف ولا يغلق إلا PRs المدرجة صراحةً عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الذي وصل مدمج وأن لكل تكرار إما قضية مشارًا إليها مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلي والتوجيه حسب التغيير

توجد منطقية مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتُنفّذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلي تلك أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات الإنتاج في النواة تُشغّل فحص أنواع إنتاج النواة واختبارات النواة، إضافة إلى فحص lint والحواجز للنواة؛
- تغييرات الاختبارات فقط في النواة تُشغّل فقط فحص أنواع اختبارات النواة إضافة إلى فحص lint للنواة؛
- تغييرات الإنتاج في الامتدادات تُشغّل فحص أنواع إنتاج الامتدادات واختبارات الامتدادات، إضافة إلى فحص lint للامتدادات؛
- تغييرات الاختبارات فقط في الامتدادات تُشغّل فحص أنواع اختبارات الامتدادات إضافة إلى فحص lint للامتدادات؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع لتشمل فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود النواة تلك (تبقى عمليات مسح امتدادات Vitest عملاً اختبارياً صريحاً)؛
- زيادات الإصدار التي تغيّر بيانات تعريف الإصدار فقط تُشغّل فحوصاً موجهة للإصدار/الإعدادات/اعتماديات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

توجيه اختبارات التغييرات محلياً موجود في `scripts/test-projects.test-support.mjs` وهو أرخص عمداً من `check:changed`: تعديلات الاختبارات المباشرة تُشغّل نفسها، وتعديلات المصدر تفضّل التعيينات الصريحة، ثم اختبارات الملفات الشقيقة والاعتمادات في مخطط الاستيراد. إعداد تسليم غرف المجموعات المشترك هو أحد التعيينات الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجّه النظام لأداة الرسائل تمر عبر اختبارات ردود النواة إضافة إلى انحدارات تسليم Discord وSlack، بحيث يفشل تغيير افتراضي مشترك قبل أول دفع للـ PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعاً بما يكفي في بيئة الاختبار بحيث لا تكون المجموعة الرخيصة المعيّنة وكيلاً موثوقاً.

## التحقق عبر Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقاً جديداً مُجهزاً مسبقاً للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولاً.

يفشل فحص السلامة بسرعة عندما تختفي ملفات جذر مطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من الـ PR؛ أوقف ذلك الصندوق وجهّز صندوقاً جديداً بدلاً من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المقصود، اضبط `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذاك.

ينهي `pnpm testbox:run` أيضاً استدعاء Blacksmith CLI محلياً إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروق المحلية الكبيرة على نحو غير معتاد.

Crabbox هو غلاف الصناديق البعيدة المملوك للمستودع لإثبات Linux لدى المشرفين. استخدمه عندما يكون الفحص أوسع من حلقة تعديل محلية، أو عندما تهم مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار أو Docker أو مسارات حزم أو صناديق قابلة لإعادة الاستخدام أو سجلات بعيدة. الواجهة الخلفية الطبيعية لـ OpenClaw هي `blacksmith-testbox`؛ أما سعة AWS/Hetzner المملوكة فهي مسار احتياطي لانقطاعات Blacksmith أو مشكلات الحصة أو الاختبار الصريح على السعة المملوكة.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ثنائية Crabbox قديمة لا تعلن عن `blacksmith-testbox`. مرّر المزوّد صراحة حتى إن كانت `.crabbox.yaml` تحتوي على افتراضيات السحابة المملوكة.

بوابة التغييرات:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

إعادة تشغيل اختبار مركّز:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

المجموعة الكاملة:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. ينبغي أن توقف عمليات Crabbox أحادية التشغيل المدعومة من Blacksmith الـ Testbox تلقائياً؛ إذا انقطع تشغيل أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمداً إلى أوامر متعددة على الصندوق المجهز نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كان Crabbox هو الطبقة المعطلة لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرة كمسار احتياطي ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات التجهيز الجديدة تبقى `queued` بلا عنوان IP أو عنوان URL لتشغيل Actions بعد دقيقتين، فتعامل مع ذلك كضغط في مزوّد Blacksmith أو الطابور أو الفوترة أو حدود المؤسسة. أوقف معرّفات الطابور التي أنشأتها، وتجنب بدء Testboxes إضافية، وانقل الإثبات إلى مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة معلومات Blacksmith والفوترة وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفاً، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحة:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلاً إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 وحدة vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot أو On-Demand Standard الإقليمية. تضبط `.crabbox.yaml` المملوكة للمستودع الافتراضات على `standard`، ومناطق سعة متعددة، و`capacity.hints: true` لكي تطبع عقود AWS المتوسطة المنطقة/السوق المختارين، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوص الواسعة الأثقل، و`large` فقط بعد أن لا يكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المقيدة بالـ CPU مثل المجموعة الكاملة أو مصفوفات Docker لكل Plugin، أو تحقق الإصدار/الحاجب الصريح، أو تحليل الأداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed` أو الاختبارات المركزة أو عمل التوثيق فقط أو فحص lint/الأنواع العادي أو إعادات إنتاج E2E الصغيرة أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط تقلب سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` افتراضيات المزوّد والمزامنة وتجهيز GitHub Actions لمسارات السحابة المملوكة. تستثني `.git` المحلي بحيث يحتفظ checkout المُجهز في Actions ببيانات Git الوصفية البعيدة الخاصة به بدلاً من مزامنة مستودعات المشرف المحلية ومخازن الكائنات، وتستثني آثار وقت التشغيل/البناء المحلية التي لا ينبغي نقلها أبداً. تمتلك `.github/workflows/crabbox-hydrate.yml` checkout وإعداد Node/pnpm وجلب `origin/main` وتسليم البيئة غير السرية لأوامر `crabbox run --id <cbx_id>` في السحابة المملوكة.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

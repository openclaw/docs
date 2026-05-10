---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة التكامل المستمر أو عدم تشغيلها
    - أنت تصحح أخطاء فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل عملية التحقق من الإصدار أو إعادة تشغيلها
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-10T19:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI يعمل عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما لا تتغير إلا مناطق غير ذات صلة. تتجاوز عمليات تشغيل `workflow_dispatch` اليدوية النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تظل مسارات Android اختيارية عبر `include_android`. تغطية Plugin المخصصة للإصدارات فقط موجودة في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                              | الغرض                                                                                                   | متى تعمل                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                   | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج بدون تبعيات مقابل تنبيهات npm                                          | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip لتبعيات الإنتاج فقط مع حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة Control، وفحوصات مخرجات البناء، ومخرجات قابلة لإعادة الاستخدام في المراحل اللاحقة                       | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات الحزم/عقد Plugin/البروتوكول                              | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى شرائح مع نتيجة فحص تجميعية مستقرة                                      | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | شرائح اختبارات Node الأساسية، باستثناء مسارات القنوات، والحزم، والعقود، والإضافات                          | تغييرات ذات صلة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبار، واختبار smoke صارم                | تغييرات ذات صلة بـ Node              |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المقسم، وحراس الإضافات، وحدود الحزمة، ومراقبة Gateway        | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات smoke للـ CLI المبني واختبار smoke لذاكرة بدء التشغيل                                                            | تغييرات ذات صلة بـ Node              |
| `checks`                         | أداة تحقق لاختبارات القنوات على مخرجات البناء                                                                 | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء وتحقق smoke لتوافق Node 22                                                                | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق الوثائق، والفحص، وفحوصات الروابط المعطلة                                                             | عند تغير الوثائق                       |
| `skills-python`                  | Ruff + pytest لـ Skills المدعومة بـ Python                                                                    | تغييرات ذات صلة بـ Skills في Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows مع انحدارات محددات استيراد وقت التشغيل المشتركة                      | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام مخرجات البناء المشتركة                                               | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | فحص Swift، والبناء، والاختبارات لتطبيق macOS                                                            | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلتا النكهتين مع بناء APK تصحيح واحد                                              | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين اختبارات Codex البطيئة يوميًا بعد نشاط موثوق                                                 | نجاح CI الرئيسي أو تشغيل يدوي |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات موفر وهمي، وتوصيف عميق، وGPT 5.4 حية | مجدول وتشغيل يدوي      |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات توجد أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام المخرجات الثقيلة ومصفوفة المنصات.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد جاهزية البناء المشترك.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تم تجاوزها عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الشرائح التجميعية `!cancelled() && always()` حتى تظل تبلغ عن إخفاقات الشرائح العادية لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تم تجاوزه بالفعل. مفتاح تزامن CI التلقائي مُصدّر (`CI-v7-*`) حتى لا يتمكن تعطل من جهة GitHub في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

ترفع مهمة `ci-timings-summary` مخرجًا مضغوطًا باسم `ci-timings-summary` لكل تشغيل CI غير مسودة. يسجل وقت الجدار، ووقت الطابور، وأبطأ المهام، والمهام الفاشلة للتشغيل الحالي، حتى لا تحتاج فحوصات صحة CI إلى كشط حمولة Actions الكاملة بشكل متكرر.

## النطاق والتوجيه

منطق النطاق موجود في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node بالإضافة إلى فحص سير العمل، لكنها لا تجبر Builds الأصلية لـ Windows أو Android أو macOS بحد ذاتها؛ تظل مسارات المنصات هذه محددة بتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات core-test الرخيصة المحددة، وتعديلات مساعد/توجيه اختبار عقد Plugin الضيقة** تستخدم مسار بيان Node سريعًا فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار مخرجات البناء، وتوافق Node 22، وعقود القنوات، وشرائح core الكاملة، وشرائح Plugin المجمّعة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعد التي تمرّنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة بأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغّل npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر، وPlugin، وinstall-smoke، والاختبارات فقط غير ذات الصلة على مسارات Linux Node.

أبطأ عائلات اختبارات Node مقسمة أو موزونة بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاث شرائح موزونة مدعومة من Blacksmith مع خيار الرجوع إلى مشغل GitHub القياسي، وتعمل مسارات core unit fast/support بشكل منفصل، وتنقسم بنية وقت تشغيل core بين شرائح الحالة، والعملية/الإعداد، وCron، والمشتركة، ويعمل الرد التلقائي كعمال موزونين (مع تقسيم شجرة الرد الفرعية إلى شرائح agent-runner وdispatch وcommands/state-routing)، وتنقسم إعدادات Gateway/server الوكيلة عبر مسارات chat/auth/model/http-plugin/runtime/startup بدل انتظار مخرجات البناء. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، وPlugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من مجمّع Plugin المشترك. تسجل شرائح أنماط التضمين إدخالات التوقيت باستخدام اسم شريحة CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وشريحة مفلترة. يبقي `check-additional` عمل تجميع/اختبار حدود الحزمة معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُخطّط قائمة حارس الحدود عبر أربع شرائح مصفوفة، كل منها يشغّل حراسًا مستقلين محددين بالتوازي ويطبع توقيتات لكل فحص. يعمل فحص انحراف لقطة مطالبة المسار السعيد المكلف لـ Codex كمهمة إضافية خاصة به لـ CI اليدوي وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير ذات الصلة خلف توليد لقطة مطالبات باردة وتبقى شرائح الحدود موزونة بينما يظل انحراف المطالبة مثبتًا على طلب السحب الذي تسبب به؛ تتجاوز العلامة نفسها توليد Vitest للقطات المطالبات داخل شريحة حدود دعم core الخاصة بمخرجات البناء. تعمل مراقبة Gateway، واختبارات القنوات، وشريحة حدود دعم core بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تحتوي نكهة الطرف الثالث على مجموعة مصادر أو manifest منفصلة؛ لا يزال مسار اختبار الوحدة الخاص بها يجمع النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيح مكررة عند كل دفع ذي صلة بـ Android.

تشغّل شريحة `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip لتبعيات الإنتاج فقط، مثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip للملفات الإنتاجية غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم لم تتم مراجعته أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب أو ينفذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام عند الدفع إلى `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو محفوفًا بالمخاطر، أو مفيدًا تشغيليًا. ينبغي أن تؤدي عمليات الفتح والتعديل الروتينية، وحركة البوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

اعتبر عناوين GitHub وتعليقاته ومتنَه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام بيانات غير موثوقة في كامل هذا المسار. فهي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادي، لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: شرائح Linux Node، وشرائح Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء السريع، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، وتدويل واجهة Control UI. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ أما مظلة الإصدار الكاملة فتفعّل Android بتمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وشريحة `agentic-plugins` الخاصة بالإصدار فقط، ومسح دفعات الإضافات الكامل، ومسارات Docker لما قبل إصدار Plugin. لا تعمل مجموعة Docker لما قبل الإصدار إلا عندما تشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى مجموعة مرشح الإصدار الكاملة بسبب تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني على فرع أو وسم أو SHA التزام كامل، مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                          | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/الحِزم المضمّنة السريعة، وفحوصات عقود القنوات المجزأة، وشرائح `check` باستثناء lint، وتجميعات `check-additional`، ومتحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضاً Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكراً |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وشرائح الإضافات الأخف وزناً، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke، وشرائح اختبارات Linux Node، وشرائح اختبارات Plugin المضمّنة، وشرائح `check-additional`، و`android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`، و`check-lint` (حساس بما يكفي للمعالج بحيث كلفت 8 vCPU أكثر مما وفرت)؛ وبُنى Docker الخاصة بـ install-smoke (كلفة وقت انتظار 32-vCPU في الطابور كانت أكثر مما وفرته)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

يبقي CI في المستودع الأساسي Blacksmith كمسار المشغّل الافتراضي. أثناء `preflight`، يفحص `scripts/ci-runner-labels.mjs` تشغيلات Actions الحديثة المصطفة والجارية بحثاً عن مهام Blacksmith المصطفة. إذا كانت تسمية Blacksmith محددة لديها مهام مصطفة بالفعل، تعود المهام اللاحقة التي كانت ستستخدم تلك التسمية نفسها إلى مشغّل GitHub المستضاف المطابق (`ubuntu-24.04` أو `windows-2025` أو `macos-latest`) لذلك التشغيل فقط. تبقى أحجام Blacksmith الأخرى ضمن عائلة نظام التشغيل نفسها على تسمياتها الأساسية. إذا فشل فحص API، فلا يُطبَّق أي رجوع احتياطي.

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

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يومياً على `main` ويمكن تشغيله يدوياً:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبّت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محلياً مع مصادقة OpenAI-متوافقة وهمية وحتمية.
- `mock-deep-profile`: تحليل CPU/heap/trace للنقاط الساخنة في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI حقيقية `openai/gpt-5.4`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحاً.

يشغّل مسار mock-provider أيضاً فحوصات مصدر أصلية لـ OpenClaw بعد تمرير Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية وhook و50-Plugin؛ وحلقات hello متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لفحص المصدر في `source/index.md` ضمن حزمة التقرير، وبجانبه JSON الخام.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطاً، يلتزم سير العمل أيضاً بـ `report.json`، و`report.md`، والحِزم، و`index.md`، وartifacts فحص المصدر إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعاً أو وسماً أو SHA التزام كامل، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لاختبار التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تُبقي التشغيلات المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية soak تلك حتى يظل التحقق الواسع من التنبيهات واسعاً. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضاً `NPM Telegram Beta E2E` مقابل artifact `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، وartifacts، و
معالجات إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُجري تعديلات. شغّله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويشغّل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغّل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغّل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التثبيت على commit في فرع سريع التغيّر، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال GitHub workflow فروعًا أو وسومًا، لا قيم commit SHA خام. يدفع
المساعد فرعًا مؤقتًا باسم `release-ci/<sha>-...` عند قيمة SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبّت، ويتحقق من أن كل
workflow فرعي بقيمة `headSha` تطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل متحقق المظلة أيضًا إذا شُغّل أي workflow فرعي عند
SHA مختلف.

يتحكم `release_profile` في نطاق live/provider المُمرَّر إلى فحوصات الإصدار. تضبط
workflows الإصدار اليدوية القيمة الافتراضية على `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة provider/media الاستشارية الواسعة. يتحكم `run_release_soak`
في ما إذا كانت فحوصات الإصدار المستقرة/الافتراضية تشغّل اختبار soak الشامل لمسار الإصدار live/E2E وDocker؛ ويفرض `full` تشغيل soak.

- يبقي `minimum` أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة provider/backend المستقرة.
- يشغّل `full` مصفوفة provider/media الاستشارية الواسعة.

تسجل المظلة معرفات تشغيل الأبناء المُرسلة، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل workflow ابن وأصبح أخضر، فأعد تشغيل مهمة متحقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للابن العادي full CI فقط، و`plugin-prerelease` لابن prerelease الخاص بالـ plugin فقط، و`release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركّز. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثلًا `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات QA لفحوصات الإصدار استشارية، لذلك تحذر إخفاقات QA فقط لكنها لا تمنع متحقق فحوصات الإصدار.

يستخدم `OpenClaw Release Checks` مرجع workflow الموثوق لحل المرجع المحدد مرة واحدة إلى tarball باسم `release-package-under-test`، ثم يمرر ذلك الأثر إلى فحوصات cross-OS وقبول الحزمة، إضافة إلى workflow Docker لمسار الإصدار live/E2E عندما تعمل تغطية soak. هذا يبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام أبناء.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تتجاوز المظلة الأقدم. يلغي مراقب الأصل أي workflow ابن أرسله بالفعل
عند إلغاء الأصل، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل فحوصات إصدار
قديم مدته ساعتان. تحافظ عمليات تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## أجزاء Live وE2E

يبقي ابن الإصدار live/E2E تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلًا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المفلترة حسب provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- أجزاء media audio/video المقسمة وأجزاء music المفلترة حسب provider

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل إخفاقات provider الحية البطيئة وتشخيصها. تبقى أسماء الأجزاء التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية مرة واحدة.

تعمل أجزاء media الأصلية الحية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبني بواسطة workflow `Live Media Runner Image`. تثبت تلك الصورة `ffmpeg` و`ffprobe` مسبقًا؛ تتحقق مهام media من الملفات الثنائية فقط قبل الإعداد. أبقِ مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية — مهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء model/backend الحية المدعومة بـ Docker صورة مشتركة منفصلة باسم `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل commit محدد. يبني workflow الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المجزأ حسب provider، وواجهة CLI الخلفية، وربط ACP، وحزم Codex harness مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أسفل مهلة مهمة workflow بحيث تفشل الحاوية العالقة أو مسار التنظيف بسرعة بدلًا من استهلاك ميزانية فحوصات الإصدار كلها. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مضبوط بشكل خاطئ وسيهدر وقت الحائط في بناء صور مكررة.

## قبول الحزمة

استخدم قبول الحزمة عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو يختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` القيمة `workflow_ref`، ويحل مرشح حزمة واحدًا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع workflow، ومرجع الحزمة، والإصدار، وSHA-256، وprofile في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل workflow القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد tarball، ويحضّر صور Docker ذات digest الحزمة عند الحاجة، ويشغل مسارات Docker المحددة على تلك الحزمة بدلًا من حزم checkout الخاص بالـ workflow. عندما يحدد profile عدة `docker_lanes` مستهدفة، يحضّر workflow القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة ومتوازية بآثار فريدة.
3. تستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. تعمل عندما لا تكون `telegram_mode` بقيمة `none` وتثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحدًا؛ لا يزال إرسال Telegram المستقل قادرًا على تثبيت مواصفة npm منشورة.
4. تفشل `summary` workflow إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- تقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw محددًا بدقة مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول prerelease/stable المنشور.
- تحزم `source=ref` فرع `package_ref` موثوقًا أو وسمًا أو commit SHA كاملًا. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن commit المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت الاعتماديات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- تنزّل `source=url` ملف `.tgz` عبر HTTPS؛ وتكون `package_sha256` مطلوبة.
- تنزّل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي توفيرها للآثار المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود workflow/harness الموثوق الذي يشغل الاختبار. `package_ref` هو commit المصدر الذي يُحزَم عندما تكون `source=ref`. هذا يتيح لحزمة الاختبار الحالية التحقق من commits مصدر موثوقة أقدم دون تشغيل منطق workflow القديم.

### Profiles المجموعات

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم profile `package` تغطية plugin بلا اتصال بحيث لا يكون تحقق الحزمة المنشورة مرهونًا بإتاحة ClawHub الحية. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

لسياسة اختبار التحديث وPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. هذا يبقي ترحيل الحزمة، والتحديث، وتثبيت Skills الحي من ClawHub، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المضبوط، وPlugin بلا اتصال، وتحديث Plugin، وإثبات Telegram على tarball الحزمة المحلول نفسه. عيّن `package_acceptance_package_spec` على Full Release Validation أو OpenClaw Release Checks لتشغيل تلك المصفوفة نفسها على حزمة npm مشحونة بدلًا من الأثر المبني من SHA. لا تزال فحوصات الإصدار cross-OS تغطي onboarding الخاص بنظام التشغيل، والمثبت، وسلوك المنصة؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاجب. في قبول الحزمة، يكون tarball `package-under-test` المحلول هو المرشح دائمًا، وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، بالقيمة الافتراضية `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. تضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبتة وfixtures على هيئة مشكلات لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المضبوطة، ومسارات السجلات بعلامة tilde، وجذور اعتماديات Plugin القديمة الراكدة. تُجزّأ اختيارات published-upgrade survivor متعددة الخطوط الأساسية حسب الخط الأساسي إلى مهام مشغل Docker مستهدفة منفصلة. يستخدم workflow `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال عن تنظيف تحديث منشور شامل، لا عن نطاق Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يضبط المسار المنشور الخط الأساسي بوصفة أمر `openclaw config set` مخبوزة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows packaged وinstaller fresh أيضًا من أن الحزمة المثبتة يمكنها استيراد تجاوز browser-control من مسار Windows مطلق خام. القيمة الافتراضية لدخان agent-turn الخاص بـ OpenAI cross-OS هي `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x.

### نوافذ التوافق القديم

لدى قبول الحزمة نوافذ محدودة للتوافق القديم للحزم المنشورة مسبقًا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من كرة tarball؛
- قد يتجاوز `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` عناصر `pnpm.patchedDependencies` المفقودة من أداة git الوهمية المشتقة من كرة tarball وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات التدخين الخاصة بـ plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضًا من ملفات ختم بيانات تعريف البناء المحلية التي كانت قد شُحنت بالفعل. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ بملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها و SHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` ومصنوعات Docker الخاصة به: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار تدخين التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. وهو يقسم تغطية اختبار التدخين إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان plugin المضمن، أو أسطح plugin/القناة/Gateway/Plugin SDK الأساسية التي تختبرها مهام تدخين Docker. لا تحجز تغييرات plugin المضمنة المصدرية فقط، وتعديلات الاختبارات فقط، وتعديلات التوثيق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغل اختبار تدخين CLI لحذف الوكلاء من مساحة العمل المشتركة، ويشغل e2e لشبكة Gateway في الحاوية، ويتحقق من وسيطة بناء امتداد مضمن، ويشغل ملف تعريف Docker المحدود لـ plugin المضمن ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع حد منفصل لكل تشغيل Docker خاص بكل سيناريو).
- **المسار الكامل** يحتفظ بتثبيت حزمة QR وتغطية Docker/update للمثبت للتشغيلات الليلية المجدولة، والاستدعاءات اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعليًا أسطح المثبت/الحزمة/Docker. في الوضع الكامل، يحضر install-smoke صورة تدخين GHCR جذرية مستهدفة SHA أو يعيد استخدامها، ثم يشغل تثبيت حزمة QR، واختبارات تدخين Dockerfile/Gateway الجذرية، واختبارات تدخين المثبت/update، وDocker E2E السريع لـ plugin المضمن كمهام منفصلة حتى لا ينتظر عمل المثبت خلف اختبارات تدخين الصورة الجذرية.

دفعات `main`، بما في ذلك commits الدمج، لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة على دفعة، يحافظ سير العمل على تدخين Docker السريع ويترك تدخين التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع اختبار تدخين موفر الصور البطيء للتثبيت العام باستخدام Bun بشكل منفصل للبوابة `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لاستدعاءات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء مسبق لصورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة ككرة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبت/update/اعتماديات plugin؛
- صورة وظيفية تثبت كرة tarball نفسها في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### المتغيرات القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للموفر.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تفرض الموفرات خنقًا.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التباعد بين بدايات المسارات لتجنب عواصف إنشاء عفريت Docker؛ اضبط `0` لعدم وجود تباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم المسارات الحية/الذيلية المحددة حدودًا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى تدخين التنظيف حتى يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن للمسار الأثقل من حده الفعلي أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تنفذ التجميعة المحلية فحوصات Docker التمهيدية، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتستمر في حفظ توقيتات المسارات للترتيب من الأطول أولًا، وتتوقف افتراضيًا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. وهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل مصنوع حزمة من التشغيل الحالي، أو ينزل مصنوع حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون كرة tarball؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. يعاد محاولة سحب صور Docker مع مهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعًا دفق سجل/ذاكرة مؤقتة عالق بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core`، و`plugins-runtime`، و`plugins-integrations` أسماء مستعارة تجميعية لـ plugin/وقت التشغيل. يبقى الاسم المستعار للمسار `install-e2e` اسم إعادة التشغيل اليدوية التجميعي لكلا مساري مثبت الموفر.

يدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط للاستدعاءات الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمنة المحاولة مرة واحدة عند فشل شبكة npm العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل إدخال سير العمل `docker_lanes` المسارات المحددة مقابل الصور المحضرة بدلًا من مهام الأجزاء، ما يبقي تصحيح المسار الفاشل محدودًا في مهمة Docker واحدة مستهدفة ويحضّر مصنوع الحزمة لذلك التشغيل أو ينزله أو يعيد استخدامه؛ إذا كان المسار المحدد مسار Docker حيًا، تبني المهمة المستهدفة صورة الاختبار الحي محليًا لذلك التشغيل المعاد. تتضمن أوامر إعادة تشغيل GitHub المولدة لكل مسار `package_artifact_run_id`، و`package_artifact_name`، ومدخلات الصور المحضرة عندما توجد تلك القيم، حتى يستطيع المسار الفاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أكثر تكلفة، لذلك فهو سير عمل منفصل يستدعيه `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية، ودفعات `main`، واستدعاءات CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات plugin المضمنة عبر ثمانية عمال امتداد؛ تشغل مهام أجزاء الامتداد هذه ما يصل إلى مجموعتي إعدادات plugin في وقت واحد مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار الإصدار التمهيدي الخاص بـ Docker والمخصص للإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام تستغرق من دقيقة إلى ثلاث دقائق.

## مختبر QA

يمتلك مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل تحت أطر QA والإصدار الواسعة، وليس سير عمل مستقلًا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسعًا.

- يشغل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند الاستدعاء اليدوي؛ وهو يوزع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود إيجار Convex.

تُشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram باستخدام مزوّد المحاكاة الحتمي والنماذج المؤهلة للمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطّل Gateway النقل الحي البحث في الذاكرة لأن تكافؤ ضمان الجودة يغطي سلوك الذاكرة بشكل منفصل؛ أما اتصال المزوّد فتغطيه مجموعات الاختبار المنفصلة للنموذج الحي، والمزوّد الأصلي، ومزوّد Docker.

يستخدم Matrix الخيار `--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI المسحوب. يبقى الإعداد الافتراضي لـ CLI ومدخل سير العمل اليدوي `all`؛ ويؤدي الإرسال اليدوي بـ `matrix_profile=all` دائما إلى تقسيم تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغّل بوابة تكافؤ ضمان الجودة حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين في مهمة تقرير صغيرة لإجراء مقارنة التكافؤ النهائية.

بالنسبة إلى طلبات السحب العادية، اتبع أدلة CI/الفحوصات محددة النطاق بدلا من معاملة التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عن قصد ماسح أمان ضيق للمرور الأول، وليس مسحا كاملا للمستودع. يوميا، ويدويا، وفي تشغيلات الحراسة لطلبات السحب غير المسودة، يفحص كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمان عالية الثقة مصفّاة إلى `security-severity` العالية/الحرجة.

تبقى حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. تبقى فحوصات CodeQL الخاصة بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                          | السطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وصندوق العزل، وCron، وخط أساس Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط لمس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدو تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android المجدول. يبني تطبيق Android يدويا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. يرفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS الأسبوعي/اليدوي. يبني تطبيق macOS يدويا لـ CodeQL على Blacksmith macOS، ويصفّي نتائج بناء التبعيات من SARIF المرفوع، ويرفع تحت `/codeql-critical-security/macos`. أُبقي خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة خطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حارس طلب السحب الخاص به أصغر عمدا من ملف الجدولة: طلبات السحب غير المسودة تشغّل فقط الأجزاء المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول Gateway/طريقة الخادم، وغراء وقت تشغيل الذاكرة/SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/فهرس النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وعقد Plugin SDK/الحزمة، أو تغييرات وقت تشغيل ردود Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغّل أجزاء جودة طلبات السحب الاثني عشر كلها.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي أدوات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، والأسرار، وصندوق العزل، وCron، وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال/الإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النماذج/المزوّدين، وإرسال الردود التلقائية والطوابير، وعقود وقت تشغيل مستوى التحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدو الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدو ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدو حمولة/تجزئة/وقت تشغيل الردود، وخيارات رد القناة، وطوابير التسليم، ومساعدو ربط الجلسة/الخيط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع فهرس النماذج، ومصادقة المزوّدين واكتشافهم، وتسجيل وقت تشغيل المزوّدين، وافتراضيات/فهارس المزوّدين، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات التحكم في Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل جلب/بحث الويب الأساسية، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقاط دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدو عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان بحيث يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL لـ Swift وPython وPlugin المضمّنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تمتلك الملفات الضيقة زمن تشغيل وإشارة مستقرين.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت مؤخرا. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح وغير صادر عن bot بعد دفع إلى `main` أن يفعّله، ويمكن للإرسال اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أُنشئ في آخر ساعة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ `Docs Agent` إلى `main` الحالي، لذلك يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح وغير صادر عن bot بعد دفع إلى `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء آخر لتشغيل سير العمل قد عمل بالفعل أو يعمل في ذلك اليوم وفق UTC. يتجاوز الإرسال اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمّعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع bot، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع مجددا؛ أما الرقع القديمة المتعارضة فتُتخطى. يستخدم Ubuntu المستضاف على GitHub لكي يستطيع إجراء Codex الحفاظ على وضعية سلامة عدم استخدام sudo نفسها مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. يكون افتراضيا في وضع التشغيل الجاف ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الذي وصل قد دُمج وأن كل تكرار لديه إما قضية مشار إليها مشتركة أو أجزاء تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

توجد منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتُنفّذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغّل فحص أنواع إنتاج النواة واختبارات النواة، بالإضافة إلى فحص النواة الأسلوبي/الحراس؛
- تغييرات اختبارات النواة فقط تشغّل فقط فحص أنواع اختبارات النواة بالإضافة إلى فحص النواة الأسلوبي؛
- تغييرات إنتاج الامتدادات تشغّل فحص أنواع إنتاج الامتدادات واختبارات الامتدادات، بالإضافة إلى فحص الامتدادات الأسلوبي؛
- تغييرات اختبارات الامتدادات فقط تشغّل فحص أنواع اختبارات الامتدادات بالإضافة إلى فحص الامتدادات الأسلوبي؛
- تغييرات Plugin SDK العام أو عقود Plugin تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود النواة تلك (تبقى عمليات مسح امتدادات Vitest عمل اختبار صريحًا)؛
- رفعات الإصدارات التي تقتصر على بيانات التعريف الخاصة بالإصدار تشغّل فحوصات موجهة للإصدار/الإعداد/اعتماد الجذر؛
- تغييرات الجذر/الإعداد غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

توجيه الاختبارات المحلية المتغيرة موجود في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر التعيينات الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد التعيينات الصريحة: تمر التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم الرد من المصدر، أو مسار مطالبة النظام لأداة الرسائل عبر اختبارات رد النواة بالإضافة إلى ارتدادات تسليم Discord وSlack، بحيث يفشل تغيير افتراضي مشترك قبل أول دفع إلى PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا على مستوى حزمة الاختبار إلى درجة أن المجموعة الرخيصة المعيّنة ليست وكيلًا موثوقًا.

## التحقق عبر Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا مُحمّى مسبقًا للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة بشكل غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات جذر مطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وحمّ صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs التي تتضمن حذوفات كبيرة مقصودة، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتلك الجولة من فحص السلامة.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على غير العادة.

Crabbox هو مغلّف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص واسعًا جدًا لحلقة تعديل محلية، أو عندما تهم مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات الحزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. خلفية OpenClaw المعتادة هي `blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة بديلًا احتياطيًا عند انقطاعات Blacksmith، أو مشكلات الحصة، أو اختبارات السعة المملوكة الصريحة.

قبل أول تشغيل، افحص المغلّف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض مغلّف المستودع نسخة Crabbox ثنائية قديمة لا تعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً حتى وإن كانت `.crabbox.yaml` تحتوي على افتراضيات السحابة المملوكة.

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. يجب أن توقف عمليات Crabbox أحادية التشغيل المدعومة بـ Blacksmith صندوق Testbox تلقائيًا؛ إذا انقطع تشغيل أو لم يكن التنظيف واضحًا، افحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق المرطّب نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت طبقة Crabbox هي المعطلة لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرةً كبديل ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان، لكن عمليات
التحمية الجديدة تبقى `queued` بلا IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فتعامل مع ذلك كضغط من مزوّد Blacksmith، أو الطابور، أو الفوترة، أو حدّ المؤسسة. أوقف
المعرّفات المصطفة التي أنشأتها، وتجنب بدء المزيد من صناديق Testbox، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص أحدهم لوحة Blacksmith،
والفوترة، وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تضبط `.crabbox.yaml` المملوكة للمستودع القيمة الافتراضية إلى `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع عقود AWS المتوسّطة المنطقة/السوق المختارين، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوصات الواسعة الأثقل، و`large` فقط بعد أن لا يعود `standard`/`fast` كافيين، و`beast` فقط للمسارات الاستثنائية المقيّدة بالمعالج مثل المجموعة الكاملة أو مصفوفات Docker لكل Plugins، أو تحقق الإصدار/الحاجب الصريح، أو تحليل الأداء عالي الأنوية. لا تستخدم `beast` من أجل `pnpm check:changed`، أو الاختبارات المركّزة، أو عمل الوثائق فقط، أو الفحص الأسلوبي/فحص الأنواع الاعتيادي، أو إعادات الإنتاج الصغيرة من نوع E2E، أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا تختلط تقلبات سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` افتراضيات المزوّد، والمزامنة، وترطيب GitHub Actions لمسارات السحابة المملوكة. تستثني `.git` المحلية بحيث يحتفظ استنساخ Actions المرطّب ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية للمشرف، وتستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. تمتلك `.github/workflows/crabbox-hydrate.yml` عملية السحب، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

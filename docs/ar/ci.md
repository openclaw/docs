---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تعمل على تصحيح فشل فحص GitHub Actions
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط وظائف CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-11T20:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI يعمل عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروق وتوقف المسارات المكلفة عندما لا تتغير إلا مناطق غير ذات صلة. تتجاوز عمليات تشغيل `workflow_dispatch` اليدوية عمدا التحديد الذكي للنطاق وتوسع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease) ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                              | الغرض                                                                                                   | متى تعمل                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                   | دائما على عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائما على عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف القفل الإنتاجي بدون اعتماديات مقابل تحذيرات npm                                          | دائما على عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائما على عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip إنتاجية للاعتماديات فقط مع حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة التحكم، وفحوصات آثار البناء، وآثار قابلة لإعادة الاستخدام في المصب                       | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات المجمّع/عقد Plugin/البروتوكول                              | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقد القنوات المقسمة إلى أجزاء مع نتيجة فحص تجميعية مستقرة                                      | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمجمّع، والعقد، والإضافات                          | تغييرات ذات صلة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبار، واختبار smoke صارم                | تغييرات ذات صلة بـ Node              |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المقسم، وحراس الإضافات، وحدود الحزم، ومراقبة Gateway        | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات smoke للـ CLI المبني وsmoke لذاكرة بدء التشغيل                                                            | تغييرات ذات صلة بـ Node              |
| `checks`                         | أداة تحقق لاختبارات قنوات آثار البناء                                                                 | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء وsmoke لتوافق Node 22                                                                | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق التوثيق، وفحصه، وفحوصات الروابط المعطلة                                                             | تغيّر التوثيق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                    | تغييرات ذات صلة بـ Skills الخاصة بـ Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows بالإضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة                      | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام آثار البناء المشتركة                                               | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                            | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلا النكهتين بالإضافة إلى بناء APK تصحيح واحد                                              | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                 | نجاح CI الرئيسي أو تشغيل يدوي |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات مزود وهمي، وملف تعريف عميق، وGPT 5.4 مباشر | مجدول وتشغيل يدوي      |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات توجد أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليسا مهمتين مستقلتين.
2. تفشل `security-scm-fast`، و`security-dependency-audit`، و`security-fast`، و`check`، و`check-additional`، و`check-docs`، و`skills-python` بسرعة دون انتظار مهام الآثار الأثقل ومصفوفة المنصات.
3. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يمكن للمستهلكين في المصب البدء بمجرد أن يصبح البناء المشترك جاهزا.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core`، و`checks-fast-contracts-channels`، و`checks-node-core-test`، و`checks`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`android`.

قد يعلّم GitHub المهام التي تجاوزتها عمليات أحدث كـ `cancelled` عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` حتى تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل كله قد تجاوزه تشغيل أحدث بالفعل. مفتاح تزامن CI التلقائي مهيأ بإصدار (`CI-v7-*`) حتى لا يستطيع كائن عالق من جهة GitHub في مجموعة طابور قديمة حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي العمليات الجارية.

ترفع مهمة `ci-timings-summary` أثرا مضغوطا باسم `ci-timings-summary` لكل تشغيل CI غير مسودة. تسجل مدة الجدار، ووقت الطابور، وأبطأ المهام، والمهام الفاشلة للتشغيل الحالي، حتى لا تحتاج فحوصات صحة CI إلى كشط حمولة Actions الكاملة مرارا.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node بالإضافة إلى فحص سير العمل، لكنها لا تفرض وحدها عمليات بناء Windows أو Android أو macOS الأصلية؛ تبقى تلك المسارات الخاصة بالمنصات محددة النطاق لتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات اختبارات core-test رخيصة مختارة، وتعديلات مساعدين/توجيه اختبارات عقود Plugin الضيقة** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المجمعة، ومصفوفات الحراس الإضافية عندما يكون التغيير مقتصرا على أسطح التوجيه أو المساعدين التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق لأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغلات npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر، وPlugin، وinstall-smoke، والاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تقسم أبطأ عائلات اختبارات Node أو توازن حتى تبقى كل مهمة صغيرة دون حجز زائد للمشغلين: تعمل عقود القنوات كثلاثة أجزاء موزونة مدعومة من Blacksmith مع مشغل GitHub القياسي كخيار احتياطي، وتعمل مسارات core unit fast/support بشكل منفصل، وتقسم بنية وقت تشغيل النواة بين أجزاء الحالة، والعملية/التكوين، وCron، والمشتركة، ويعمل auto-reply كعمال متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner، وdispatch، وcommands/state-routing)، وتقسم تكوينات Gateway/الخادم الوكيلية عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلا من انتظار آثار البناء. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة تكوينات Vitest المخصصة لها بدلا من الالتقاط الشامل المشترك لـ Plugin. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، حتى يستطيع `.artifacts/vitest-shard-timings.json` تمييز تكوين كامل من جزء مرشح. يبقي `check-additional` عمل ترجمة/كناري حدود الحزم معا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ توزع قائمة حارس الحدود على أربعة أجزاء مصفوفة، يشغل كل منها حراسا مستقلين مختارين بالتزامن ويطبع توقيتات لكل فحص. يعمل فحص انحراف لقطة المطالبة الخاصة بمسار Codex السعيد المكلف كمهمة إضافية مستقلة لـ CI اليدوي وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير ذات الصلة خلف توليد لقطة مطالبة باردة وتظل أجزاء الحدود متوازنة بينما يبقى انحراف المطالبة مثبتا بطلب السحب الذي سببه؛ تتخطى الراية نفسها توليد Vitest للقطات المطالبات داخل جزء حدود دعم النواة الخاص بآثار البناء. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم النواة بالتزامن داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغل Android CI كلا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تحتوي نكهة الطرف الثالث على مجموعة مصدر أو بيان منفصل؛ لا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع رايات BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف debug APK مكررة عند كل دفعة ذات صلة بـ Android.

يشغل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية للاعتماديات فقط مثبتة على أحدث إصدار Knip، مع تعطيل حد العمر الأدنى للإصدار في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفا جديدا غير مستخدم وغير مراجع أو يترك إدخال قائمة سماح قديما، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات المباشرة، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب أو ينفذ كود طلبات سحب غير موثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يتفقده وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدا تمرير جسم Webhook الكامل. سير العمل المستقبل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام هو مراقبة، لا تسليم افتراضي. يتلقى وكيل ClawSweeper هدف Discord في مطالبته وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئا، أو قابلا للتنفيذ، أو خطرا، أو مفيدا تشغيليا. ينبغي أن تؤدي عمليات الفتح، والتحرير، واضطراب الروبوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته ومتونه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام على أنها بيانات غير موثوقة عبر هذا المسار كله. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات الإطلاق اليدوية

تشغّل عمليات إطلاق CI اليدوية مخطط المهام نفسه مثل CI العادي، لكنها تفرض تشغيل كل مسار محدود النطاق غير خاص بـ Android: شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار بناء الدخان، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وتعريب واجهة Control UI. تشغّل عمليات إطلاق CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وشظية `agentic-plugins` الخاصة بالإصدار فقط، ومسح دفعات الامتدادات الكامل، ومسارات Docker لما قبل إصدار Plugin. لا تعمل حزمة Docker لما قبل الإصدار إلا عندما تطلق `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى حزمة مرشح الإصدار الكاملة بواسطة تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط مقابل فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع الإطلاق المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، مهام الأمان السريعة والمجمّعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، فحوصات البروتوكول/العقود/المضمّنات السريعة، فحوصات عقود القنوات المقسّمة، شظايا `check` باستثناء lint، مجمّعات `check-additional`، أدوات التحقق المجمّعة لاختبارات Node، فحوصات المستندات، Python skills، workflow-sanity، labeler، auto-response؛ يستخدم تمهيد install-smoke أيضا Ubuntu مستضافا على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شظايا الامتدادات الأخف وزنا، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke، شظايا اختبارات Linux Node، شظايا اختبارات Plugin المضمّنة، شظايا `check-additional`، `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`، `check-lint` (حساس بما يكفي للمعالج بحيث كلّفت 8 vCPU أكثر مما وفّرت)؛ عمليات بناء Docker الخاصة بـ install-smoke (كلّف وقت طابور 32-vCPU أكثر مما وفّر)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

يبقي CI في المستودع القانوني Blacksmith كمسار المشغّل الافتراضي. أثناء `preflight`، يفحص `scripts/ci-runner-labels.mjs` تشغيلات Actions الأخيرة المصطفة وقيد التنفيذ بحثا عن مهام Blacksmith المصطفة. إذا كان لدى تسمية Blacksmith محددة مهام مصفوفة بالفعل، تعود المهام اللاحقة التي كانت ستستخدم تلك التسمية نفسها إلى مشغّل GitHub المستضاف المطابق (`ubuntu-24.04` أو `windows-2025` أو `macos-latest`) لذلك التشغيل فقط. تبقى أحجام Blacksmith الأخرى في عائلة نظام التشغيل نفسها على تسمياتها الأساسية. إذا فشل فحص API، فلا يُطبّق أي رجوع احتياطي.

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

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميا على `main` ويمكن إطلاقه يدويا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس الإطلاق اليدوي عادة مرجع سير العمل. عيّن `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبّت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل بناء محلي بمصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل CPU/heap/trace لمواضع بدء التشغيل وGateway ودورة الوكيل الساخنة.
- `live-gpt54`: دورة وكيل OpenAI `openai/gpt-5.4` حقيقية، تُتخطى عندما لا يتوفر `OPENAI_API_KEY`.

يشغّل مسار mock-provider أيضا مسابير مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية وhook و50 Plugin؛ وحلقات hello متكررة من mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء تشغيل CLI مقابل Gateway المشغّل. يوجد ملخص Markdown لمسبار المصدر في `source/index.md` ضمن حزمة التقرير، وبجواره JSON الخام.

يرفع كل مسار مصنوعات GitHub. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يلتزم سير العمل أيضا بـ `report.json` و`report.md` والحزم و`index.md` ومصنوعات مسبار المصدر في `openclaw/clawgrit-reports` ضمن `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لـ"تشغيل كل شيء قبل الإصدار". يقبل فرعا أو وسما أو SHA التزام كاملا، ويطلق سير عمل `CI` اليدوي بذلك الهدف، ويطلق `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويطلق `OpenClaw Release Checks` لاختبار دخان التثبيت، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تبقي التشغيلات المستقرة/الافتراضية تغطية live/E2E وDocker الشاملة لمسار الإصدار خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية soak تلك حتى يظل التحقق الاستشاري الواسع واسعا. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضا `NPM Telegram Beta E2E` مقابل مصنوع `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وDocker، وعبر أنظمة التشغيل، وTelegram دون إعادة بناء. استخدم `npm_telegram_package_spec` فقط عندما يجب على Telegram إثبات حزمة مختلفة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للحصول على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، والمصنوعات، و
مقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يجري تغييرات. أطلقه
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويطلق `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويطلق
`Plugin ClawHub Release` لنفس SHA الإصدار، وبعد ذلك فقط يطلق
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات الالتزام المثبّت على فرع سريع الحركة، استخدم الأداة المساعدة بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل GitHub workflow فروعًا أو وسومًا، وليست قيم commit SHA خامًا. تدفع
الأداة المساعدة فرعًا مؤقتًا باسم `release-ci/<sha>-...` عند SHA الهدف،
وتشغّل `Full Release Validation` من ذلك المرجع المثبّت، وتتحقق من أن كل
`headSha` في workflow فرعي يطابق الهدف، وتحذف الفرع المؤقت عند اكتمال
التشغيل. كما يفشل متحقق المظلة إذا كان أي workflow فرعي قد شُغّل عند SHA
مختلف.

يتحكم `release_profile` في اتساع فحوص الإصدار المباشر/المزوّد المُمرَّر إلى فحوص الإصدار. تكون
إعدادات workflows الإصدار اليدوية الافتراضية `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة المزوّد/الوسائط الاستشارية الواسعة. يتحكم `run_release_soak`
في ما إذا كانت فحوص الإصدار المستقرة/الافتراضية تشغّل اختبار التحمل الشامل لمسار الإصدار المباشر/E2E وDocker؛
يفرض `full` تشغيل اختبار التحمل.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّد/الخلفية المستقرة.
- يشغّل `full` مصفوفة المزوّد/الوسائط الاستشارية الواسعة.

تسجل المظلة معرّفات التشغيل الفرعية التي تم تشغيلها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أُعيد تشغيل workflow فرعي وأصبح أخضر، فأعد تشغيل مهمة التحقق الأصلية فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الفرعي العادي الكامل لـCI فقط، و`plugin-prerelease` للفرع الفرعي الخاص بالإصدار التمهيدي للـPlugin فقط، و`release-checks` لكل فرع إصدار فرعي، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. هذا يحافظ على إعادة تشغيل صندوق إصدار فاشل ضمن نطاق محدود بعد إصلاح مركّز. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثلًا `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية، لذا فإن إخفاقات QA فقط تحذّر لكنها لا تحظر متحقق فحوص الإصدار.

يستخدم `OpenClaw Release Checks` مرجع workflow الموثوق لحل المرجع المحدد مرة واحدة إلى tarball باسم `release-package-under-test`، ثم يمرر ذلك الأثر إلى فحوص cross-OS وPackage Acceptance، إضافة إلى workflow Docker المباشر/E2E لمسار الإصدار عند تشغيل تغطية التحمل. هذا يحافظ على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

تتجاوز عمليات `Full Release Validation` المكررة لـ`ref=main` و`rerun_group=all`
المظلة الأقدم. يلغي مراقب الأصل أي workflow فرعي كان قد شغّله بالفعل عند
إلغاء الأصل، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل فحوص إصدار قديم مدته ساعتان. تحافظ عمليات تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## أجزاء live وE2E

يحافظ الفرع الفرعي المباشر/E2E للإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلًا من مهمة تسلسلية واحدة:

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

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات المزوّد المباشر البطيئة أسهل في إعادة التشغيل والتشخيص. تبقى أسماء الأجزاء التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط المباشرة الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة workflow باسم `Live Media Runner Image`. يثبّت ذلك image مسبقًا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ مجموعات الاختبار المباشرة المدعومة بـDocker على مشغّلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker المتداخلة.

تستخدم أجزاء النموذج/الخلفية المباشرة المدعومة بـDocker image مشتركة منفصلة باسم `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني workflow الإصدار المباشر ذلك image ويدفعه مرة واحدة، ثم تعمل أجزاء نموذج Docker المباشر، وGateway المجزأ حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة Codex harness مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة workflow، بحيث يفشل مسار الحاوية أو التنظيف العالق بسرعة بدلًا من استهلاك ميزانية فحوص الإصدار كاملة. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مضبوط على نحو خاطئ وسيهدر وقتًا فعليًا على عمليات بناء image مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` ‏`workflow_ref`، ويحل مرشح حزمة واحدًا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما معًا كأثر `package-under-test`، ويطبع المصدر ومرجع workflow ومرجع الحزمة والإصدار وSHA-256 والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` ‏`openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل workflow القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من قائمة tarball، ويحضّر Docker images الخاصة بملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلًا من حزم checkout الخاص بالـworkflow. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يحضّر workflow القابل لإعادة الاستخدام الحزمة وimages المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبّت الأثر نفسه `package-under-test` عندما يحل Package Acceptance واحدًا؛ ولا يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` الـworkflow إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدار التمهيدي/المستقر المنشور.
- يحزم `source=ref` فرعًا أو وسمًا أو SHA التزامًا كاملًا موثوقًا في `package_ref`. يجلب المحلّل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من تاريخ فرع المستودع أو وسم إصدار، ويثبّت التبعيات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عبر HTTPS؛ وتكون `package_sha256` مطلوبة.
- ينزّل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكنها يجب أن تُقدَّم للآثار المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود workflow/الحزمة الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم بدون تشغيل منطق workflow القديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `skill-install`، `update-corrupt-plugin`، `upgrade-survivor`، `published-upgrade-survivor`، `update-restart-auth`، `plugins-offline`، `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف `package` الشخصي تغطية Plugin دون اتصال بحيث لا يكون تحقق الحزمة المنشورة مرهونًا بتوفر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع الإبقاء على مسار مواصفة npm المنشورة للتشغيلات المستقلة.

لسياسة اختبار التحديثات والـPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات والـPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثرية حزمة الإصدار المحضّرة، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يحافظ هذا على ترحيل الحزمة، والتحديث، وتثبيت مهارة ClawHub الحية، وتنظيف تبعيات Plugin القديمة، وإصلاح تثبيت Plugin المكوّن، وPlugin دون اتصال، وتحديث Plugin، وإثبات Telegram على ملف tarball نفسه للحزمة المحلولة. عيّن `release_package_spec` في التحقق الكامل من الإصدار أو فحوصات إصدار OpenClaw بعد نشر بيتا لتشغيل المصفوفة نفسها على حزمة npm المشحونة دون إعادة البناء؛ وعيّن `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية التحقق من الإصدار. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة؛ ويجب أن يبدأ تحقق المنتج للحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker‏ `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة في كل تشغيل ضمن مسار الإصدار الحاجب. في قبول الحزمة، يكون ملف tarball المحلول `package-under-test` هو المرشح دائمًا، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع الافتراض إلى `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يعيّن التحقق الكامل من الإصدار مع `run_release_soak=true` أو `release_profile=full` القيمتين `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسّع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبّتة والتجهيزات المصممة على شكل قضايا لإعداد Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات Plugin OpenClaw المكوّنة، ومسارات السجلات التي تستخدم التلدة، وجذور تبعيات Plugin القديمة الراكدة. تُجزّأ اختيارات ناجي الترقية المنشورة متعددة خطوط الأساس حسب خط الأساس إلى وظائف مشغّل Docker مستهدفة منفصلة. يستخدم سير العمل المنفصل `Update Migration` مسار Docker‏ `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال متعلقًا بتنظيف التحديث المنشور الشامل، وليس باتساع CI العادي للتحقق الكامل من الإصدار. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يكوّن المسار المنشور خط الأساس باستخدام وصفة أوامر `openclaw config set` مضمّنة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الطازجة للحزمة والمثبّت أيضًا من أن الحزمة المثبّتة يمكنها استيراد تجاوز للتحكم في المتصفح من مسار Windows مطلق خام. يستخدم فحص دخان دورة وكيل OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيًا عند تعيينه، وإلا يستخدم `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

لدى قبول الحزمة نوافذ محدودة للتوافق القديم للحزم المنشورة مسبقًا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك الخيار؛
- قد يزيل `update-channel-switch` تبعيات pnpm `patchedDependencies` المفقودة من تجهيز git الوهمي المشتق من tarball، وقد يسجل فقدان `update.channel` المستمر؛
- قد تقرأ فحوصات دخان Plugin مواقع سجلات التثبيت القديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضًا بشأن ملفات طابع بيانات تعريف البناء المحلي التي كانت قد شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` للتأكد من مصدر الحزمة، وإصدارها، وقيمة SHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وأثريات Docker الخاصة به: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل التحقق الكامل من الإصدار.

## دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر وظيفة `preflight` الخاصة به. وهو يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمّنة، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها وظائف دخان Docker. لا تحجز تغييرات Plugin المضمّنة المصدرية فقط، أو تعديلات الاختبارات فقط، أو تعديلات التوثيق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويفحص CLI، ويشغّل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway في الحاوية، ويتحقق من وسيطة بناء إضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود لـ Plugin المضمّن تحت مهلة إجمالية للأمر مقدارها 240 ثانية (مع حد مستقل لكل تشغيل Docker في كل سيناريو).
- **المسار الكامل** يحتفظ بتغطية تثبيت حزمة QR وDocker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات إصدار workflow-call، وطلبات السحب التي تمس فعلًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة دخان Dockerfile جذر GHCR واحدة لهدف SHA، ثم يشغّل تثبيت حزمة QR، وفحوصات دخان Dockerfile/Gateway الجذر، وفحوصات دخان المثبّت/التحديث، وDocker E2E السريع لـ Plugin المضمّن كوظائف منفصلة حتى لا ينتظر عمل المثبّت خلف فحوصات دخان الصورة الجذرية.

لا تفرض عمليات الدفع إلى `main` (بما في ذلك commits الدمج) المسار الكامل؛ وعندما تطلب منطقية نطاق التغيير تغطية كاملة على عملية دفع، يحافظ سير العمل على دخان Docker السريع ويترك دخان التثبيت الكامل للتشغيل الليلي أو التحقق من الإصدار.

يُحرس دخان مزود الصور لتثبيت Bun العالمي البطيء بشكل منفصل بواسطة `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب وعمليات الدفع إلى `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقًا صورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف tarball لـ npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/تبعية Plugin؛
- صورة وظيفية تثبّت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، وتوجد منطقية المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، وينفذ المشغّل الخطة المحددة فقط. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### إعدادات قابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تخنق المزودات الطلبات.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد المسارات المتزامنة متعددة الخدمات.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تباعد بين بدايات المسارات لتجنب عواصف الإنشاء في عفريت Docker؛ عيّن `0` لعدم استخدام تباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيلية محددة حدودًا أشد.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معيّن   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معيّن   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى دخان التنظيف حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعلي أن يبدأ من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تتحقق التجميعة المحلية مسبقًا من Docker، وتزيل حاويات OpenClaw E2E الراكدة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول إلى الأقصر، وتتوقف افتراضيًا عن جدولة مسارات مجمعة جديدة بعد الفشل الأول.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية الاعتمادات المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. وهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثرية حزمة من التشغيل الحالي، أو ينزّل أثرية حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية لـ GHCR الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة من Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو الصور الموجودة ذات ملخص الحزمة بدلًا من إعادة البناء. تُعاد محاولة سحب صور Docker بمهلة محدودة مقدارها 180 ثانية لكل محاولة، بحيث يعاد بسرعة تدفق سجل/ذاكرة مؤقتة عالق بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كوظائف مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

تقطيعات Docker للإصدار الحالي هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماءً مستعارة تجميعية للمكونات الإضافية/وقت التشغيل. يبقى الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوي لكلا مساري مثبّت المزوّد.

يُدمج OpenWebUI ضمن `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بتقطيعة مستقلة `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند حدوث إخفاقات عابرة في شبكة npm.

ترفع كل تقطيعة `.artifacts/docker-tests/` مع سجلات المسار، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وملف JSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يُشغّل إدخال سير العمل `docker_lanes` المسارات المحددة مقابل الصور المحضّرة بدلًا من مهام التقطيع، ما يبقي تصحيح المسار الفاشل محصورًا في مهمة Docker واحدة مستهدفة، ويحضّر أو ينزّل أو يعيد استخدام أثر الحزمة لذلك التشغيل؛ وإذا كان المسار المحدد مسار Docker حيًا، تبني المهمة المستهدفة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل التي يولدها GitHub لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصورة المحضّرة عندما تكون تلك القيم موجودة، بحيث يمكن للمسار الفاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # تنزيل آثار Docker وطباعة أوامر إعادة التشغيل المستهدفة المجمّعة/لكل مسار
pnpm test:docker:timings <summary>   # ملخصات المسارات البطيئة والمسار الحرج للمراحل
```

يشغّل سير العمل المجدول للاختبارات الحية/E2E مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية للمنتج/الحزمة أعلى تكلفة، لذلك فهو سير عمل منفصل يُشغَّل بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات الإرسال اليدوية المستقلة لـ CI هذه المجموعة متوقفة. يوازن اختبارات المكونات الإضافية المضمّنة عبر ثمانية عمال للامتدادات؛ وتشغّل مهام شظايا الامتدادات هذه ما يصل إلى مجموعتي إعدادات Plugin في الوقت نفسه، مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات المكونات الإضافية كثيفة الاستيراد مهام CI إضافية. يجمع مسار الإصدار التمهيدي الخاص بـ Docker للإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام تستغرق دقيقة إلى ثلاث دقائق. يرفع سير العمل أيضًا أثرًا معلوماتيًا `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ وتُعد نتائج الفاحص مدخلات فرز ولا تغيّر بوابة Plugin Prerelease الحاجزة.

## مختبر ضمان الجودة

يمتلك QA Lab مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. يُضمّن تكافؤ الوكلاء تحت حزم QA الواسعة وحزم الإصدار، وليس كسير عمل مستقل لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسع.

- يشغّل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند الإرسال اليدوي؛ ويفرّع مسار تكافؤ المحاكاة، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord حجوزات Convex.

تشغّل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين باستخدام مزوّد المحاكاة الحتمي ونماذج مؤهلة بالمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن انتقال النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتُغطى اتصالية المزوّد بواسطة مجموعات النموذج الحي المنفصلة والمزوّد الأصلي ومزوّد Docker.

يستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما تدعمه CLI الجاري فحصها. يبقى إدخال سير العمل اليدوي والافتراضي في CLI هو `all`؛ وإرسال `matrix_profile=all` اليدوي يشظّي دائمًا تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ QA لديه حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحوصات المحددة النطاق بدلًا من معاملة التكافؤ كحالة مطلوبة.

## CodeQL

سير العمل `CodeQL` هو عن قصد ماسح أمان ضيق للمرور الأول، وليس مسحًا كاملًا للمستودع. تفحص عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أعلى أسطح JavaScript/TypeScript خطورة باستخدام استعلامات أمان عالية الثقة مرشحة إلى `security-severity` عالٍ/حرج.

تبقى حراسة طلب السحب خفيفة: تبدأ فقط للتغييرات تحت `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                          | السطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وبيئة العزل، وCron، وخط أساس Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات في النواة إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF في النواة، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK |

### شظايا الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، وتستبعد نتائج بناء التبعيات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. تُبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المطابقة. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية بشدة أخطاء على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة بها أصغر عمدًا من الملف المجدول: لا تشغّل طلبات السحب غير المسودة سوى شظايا PR الجودة المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/بيئة العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/وصلات SDK، وMCP/العملية/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وعقد Plugin SDK/الحزمة، أو تغييرات وقت تشغيل رد Plugin SDK. تشغّل تغييرات إعداد CodeQL وسير عمل الجودة كل شظايا جودة PR الاثنتي عشرة.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي نقاط ربط للتعليم/التكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | المصادقة، والأسرار، وصندوق العزل، وCron، وكود حدود أمان Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط التكوين، والترحيل، والتطبيع، وعقود الإدخال والإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود أساليب الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوجيه النموذج/الموفر، وتوجيه الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى التحكم في ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء SDK المستعارة لذاكرة Plugin، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/التقسيم/وقت التشغيل، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/السلسلة             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة الموفر واكتشافه، وتسجيل وقت تشغيل الموفر، وافتراضات/كتالوجات الموفر، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمل، والسجل، والسطح العام، ونقاط دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور على جانب الحزمة ومساعدات عقود حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الشخصية الضيقة مستقرة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت حديثا. ليس له جدول زمني صرف: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يشغله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أنشئ في الساعة الأخيرة. عند تشغيله، يراجع نطاق الالتزام من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبار

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. ليس له جدول زمني صرف: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يشغله، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد عمل بالفعل أو يعمل في ذلك اليوم وفق UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضعية أمان drop-sudo نفسها مثل وكيل المستندات.

### طلبات PR المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرف لتنظيف التكرارات بعد الهبوط. يكون افتراضيا في وضع التشغيل الجاف ولا يغلق إلا طلبات PR المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب PR الهابط مدمج وأن لكل تكرار إما مسألة مرجعية مشتركة أو أجزاء تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية والتوجيه حسب التغييرات

يعيش منطق المسارات المحلية المتغيرة في `scripts/changed-lanes.mjs` وينفذه `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغل فحص الأنواع لإنتاج النواة واختبارات النواة بالإضافة إلى فحص lint/الحراس للنواة؛
- تغييرات النواة الخاصة بالاختبارات فقط تشغل فحص أنواع اختبارات النواة فقط بالإضافة إلى lint النواة؛
- تغييرات إنتاج الإضافة تشغل فحص أنواع إنتاج الإضافة واختبارات الإضافة بالإضافة إلى lint الإضافة؛
- تغييرات الإضافة الخاصة بالاختبارات فقط تشغل فحص أنواع اختبارات الإضافة بالإضافة إلى lint الإضافة؛
- تغييرات Plugin SDK العامة أو عقد Plugin توسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود النواة هذه (تبقى عمليات مسح إضافات Vitest عملا اختباريا صريحا)؛
- زيادات إصدار بيانات التعريف الخاصة بالإصدار فقط تشغل فحوصات إصدار/تكوين/تبعية جذرية مستهدفة؛
- تغييرات الجذر/التكوين غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبار المباشرة تشغل نفسها، وتفضّل تعديلات المصدر التعيينات الصريحة، ثم اختبارات الأشقاء والمعتمدين عبر مخطط الاستيراد. تكوين تسليم غرفة المجموعة المشتركة هو أحد التعيينات الصريحة: تمر التغييرات في تكوين الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجه نظام أداة الرسائل عبر اختبارات الرد الأساسية بالإضافة إلى تراجعات تسليم Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير على مستوى الحزام كله بما يكفي لأن تكون المجموعة المعينة الرخيصة غير موثوقة كبديل.

## تحقق Testbox

Crabbox هو غلاف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص واسعا جدا لحلقة تحرير محلية، أو عندما يهم
تكافؤ CI، أو عندما يحتاج الإثبات إلى أسرار أو Docker أو مسارات حزم أو
صناديق قابلة لإعادة الاستخدام أو سجلات بعيدة. واجهة OpenClaw الخلفية العادية هي
`blacksmith-testbox`؛ وتعد سعة AWS/Hetzner المملوكة بديلا احتياطيا عند أعطال Blacksmith
أو مشكلات الحصة أو اختبار السعة المملوكة صراحة.

تشغل عمليات Blacksmith المدعومة بـ Crabbox الإحماء، والمطالبة، والمزامنة، والتشغيل، والتقرير، والتنظيف
لـ Testboxes مرة واحدة. يفشل فحص سلامة المزامنة المدمج بسرعة عندما تختفي ملفات الجذر
المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 حذف متتبع. بالنسبة إلى طلبات PR ذات الحذف الكبير المقصود، عيّن
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضا استدعاء CLI المحلي لـ Blacksmith الذي يبقى في
مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. عيّن
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة
أكبر بالميلي ثانية للفروق المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ثنائية Crabbox قديمة لا تعلن `blacksmith-testbox`. مرر الموفر صراحة حتى لو كانت `.crabbox.yaml` تحتوي على افتراضات السحابة المملوكة.

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

إعادة تشغيل اختبار مركز:

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

الحزمة الكاملة:

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. يجب أن توقف عمليات Crabbox المدعومة بـ Blacksmith لمرة واحدة Testbox تلقائيا؛ إذا تمت مقاطعة تشغيل أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدا إلى أوامر متعددة على الصندوق المرطب نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت طبقة Crabbox هي المعطلة لكن Blacksmith نفسه يعمل، فاستخدم
Blacksmith مباشرة للتشخيص فقط مثل `list` و`status` والتنظيف. أصلح
مسار Crabbox قبل اعتبار تشغيل Blacksmith مباشر إثباتا للمشرف.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات
الإحماء الجديدة تبقى `queued` بلا IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فاعتبر ذلك ضغطا على موفر Blacksmith أو الطابور أو الفوترة أو حدود المؤسسة. أوقف
معرفات الطابور التي أنشأتها، وتجنب بدء المزيد من Testboxes، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة معلومات Blacksmith
والفوترة وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو تكون السعة المملوكة هي الهدف صراحة:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنّب `class=beast` ما لم تكن المهمة تحتاج فعلاً إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU، وهو أسهل طريقة لتجاوز حصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تضبط `.crabbox.yaml` المملوكة للمستودع القيم الافتراضية على `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع حجوزات AWS المتوسَّطة المنطقة/السوق المحددة، وضغط الحصص، والرجوع الاحتياطي إلى Spot، وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوصات الواسعة الأثقل، و`large` فقط بعد أن لا تكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المرتبطة بقوة CPU مثل مصفوفات Docker للحزمة الكاملة أو لكل Plugin، أو تحقق إصدار/حاجب صريح، أو تحليل أداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed`، أو الاختبارات المركزة، أو العمل الخاص بالوثائق فقط، أو lint/typecheck العادي، أو إعادات إنتاج E2E الصغيرة، أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا تختلط تقلبات سوق Spot بالإشارة.

تملك `.crabbox.yaml` القيم الافتراضية للمزوّد والمزامنة وترطيب GitHub Actions لمسارات السحابة المملوكة. وهي تستثني `.git` المحلي لكي يحتفظ checkout المرطَّب في Actions ببيانات Git الوصفية البعيدة الخاصة به بدلاً من مزامنة remotes ومخازن الكائنات المحلية الخاصة بالمشرف، وتستثني آثار التشغيل/البناء المحلية التي ينبغي ألا تُنقل مطلقاً. يملك `.github/workflows/crabbox-hydrate.yml` عمليات checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتمرير البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

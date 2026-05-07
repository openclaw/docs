---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح فحص فاشل في GitHub Actions
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام التكامل المستمر، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-07T13:13:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI يعمل عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` بوعي تحديد النطاق الذكي وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تقع تغطية Plugin الخاصة بالإصدارات فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو عبر تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                            | الغرض                                                                                                   | متى تعمل                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                       | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج دون تبعيات مقابل تنبيهات npm                                                       | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                                         | دائمًا عند عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip للإنتاج الخاصة بالتبعيات فقط مع حارس قائمة السماح للملفات غير المستخدمة                     | تغييرات ذات صلة بـ Node            |
| `build-artifacts`                | بناء `dist/`، وواجهة تحكم المستخدم، وفحوصات آثار البناء، وآثار قابلة لإعادة الاستخدام في المراحل اللاحقة | تغييرات ذات صلة بـ Node            |
| `checks-fast-core`               | مسارات صحة Linux سريعة مثل فحوصات الحزم/عقود Plugin/البروتوكول                                           | تغييرات ذات صلة بـ Node            |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                                                  | تغييرات ذات صلة بـ Node            |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، مع استثناء مسارات القنوات والحزم والعقود والإضافات                         | تغييرات ذات صلة بـ Node            |
| `check`                          | مكافئ بوابة محلية رئيسية مجزأة: أنواع الإنتاج، والLint، والحراس، وأنواع الاختبارات، واختبار دخان صارم   | تغييرات ذات صلة بـ Node            |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المجزأ، وحراس الإضافات، وحدود الحزم، ومراقبة Gateway                  | تغييرات ذات صلة بـ Node            |
| `build-smoke`                    | اختبارات دخان CLI المبني واختبار دخان ذاكرة بدء التشغيل                                                  | تغييرات ذات صلة بـ Node            |
| `checks`                         | محقق لاختبارات القنوات الخاصة بآثار البناء                                                               | تغييرات ذات صلة بـ Node            |
| `checks-node-compat-node22`      | مسار بناء ودخان لتوافق Node 22                                                                            | تشغيل CI يدوي للإصدارات           |
| `check-docs`                     | فحوصات تنسيق التوثيق والLint والروابط المعطلة                                                            | تغيّر التوثيق                      |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                              | تغييرات ذات صلة بـ Python Skills  |
| `checks-windows`                 | اختبارات عمليات/مسارات خاصة بـ Windows مع تراجعات مشتركة لمحددات استيراد وقت التشغيل                    | تغييرات ذات صلة بـ Windows         |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام آثار البناء المشتركة                                         | تغييرات ذات صلة بـ macOS           |
| `macos-swift`                    | Swift lint والبناء والاختبارات لتطبيق macOS                                                              | تغييرات ذات صلة بـ macOS           |
| `android`                        | اختبارات وحدة Android لكلا النكهتين مع بناء APK تصحيح واحد                                               | تغييرات ذات صلة بـ Android         |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                        | نجاح CI الرئيسي أو تشغيل يدوي      |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات موفر وهمي، وملف تعريف عميق، وGPT 5.4 مباشر       | مجدول وتشغيل يدوي                 |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` هما خطوتان داخل هذه المهمة، وليسا مهمتين مستقلتين.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام آثار البناء ومصفوفة المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد جاهزية البناء المشترك.
4. تتوسع بعد ذلك مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تجاوزتها عمليات أحدث باعتبارها `cancelled` عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات تجميع الأجزاء `!cancelled() && always()` بحيث تظل تبلغ عن إخفاقات الأجزاء العادية لكنها لا تُصف بعد أن يكون سير العمل كله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) حتى لا يتمكن شبح من جهة GitHub في مجموعة صف قديمة من حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

ترفع مهمة `ci-timings-summary` أثرًا مضغوطًا باسم `ci-timings-summary` لكل تشغيل CI غير مسودة. يسجل زمن الحائط، ووقت الانتظار في الصف، وأبطأ المهام، والمهام الفاشلة للتشغيل الحالي، بحيث لا تحتاج فحوصات صحة CI إلى كشط حمولة Actions الكاملة مرارًا.

## النطاق والتوجيه

يقع منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم Node CI البياني مع workflow linting، لكنها لا تفرض بحد ذاتها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات محددة النطاق لتغييرات مصادر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات محددة على تجهيزات اختبارات أساسية رخيصة، وتعديلات ضيقة على مساعدين/اختبارات توجيه عقود Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، والأجزاء الأساسية الكاملة، وأجزاء Plugin المجمعة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدين التي تمرنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق لأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي تشغيل npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير المرتبطة وPlugin وinstall-smoke والاختبارات فقط على مسارات Linux Node.

تُقسّم أو تُوازن عائلات اختبارات Node الأبطأ بحيث تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة مدعومة من Blacksmith مع احتياطي مشغل GitHub القياسي، وتعمل مسارات core unit fast/support منفصلة، وتُقسّم بنية وقت التشغيل الأساسية بين أجزاء state وprocess/config وcron والمشتركة، ويعمل auto-reply كعاملين متوازنين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسّم إعدادات agentic gateway/server عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلًا من الانتظار على آثار البناء. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من الالتقاط العام المشترك لـ Plugin. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل عن جزء مرشح. يحافظ `check-additional` على أعمال compile/canary الخاصة بحدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُخطط قائمة حراس الحدود عبر أربعة أجزاء مصفوفة، يشغّل كل منها حراسًا مستقلين محددين بالتزامن ويطبع توقيتات لكل فحص. يعمل فحص انحراف لقطة مطالبة المسار السعيد المكلف في Codex كمهمة إضافية مستقلة لـ CI اليدوي وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير المرتبطة خلف توليد لقطات المطالبات البارد وتبقى أجزاء الحدود متوازنة بينما يظل انحراف المطالبة مثبتًا إلى طلب السحب الذي سببه؛ تتخطى العلامة نفسها توليد Vitest للقطات المطالبات داخل جزء support-boundary الأساسي الخاص بآثار البناء. تعمل مراقبة Gateway، واختبارات القنوات، وجزء support-boundary الأساسي بالتزامن داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ ما يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة برسائل SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيح مكررة عند كل دفع ذي صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية للتبعيات فقط مثبتة على أحدث إصدار Knip، مع تعطيل حد العمر الأدنى لإصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية والتوليد والبناء والاختبارات المباشرة وجسور الحزم المقصودة التي لا يستطيع Knip حلها ثابتًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يفحص أو ينفذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام عند الدفع إلى `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، والرابط، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستلم في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، وينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام ملاحظة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للإجراء أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

عامل عناوين GitHub وتعليقاته ومتونَه ونصوص المراجعات وأسماء الفروع ورسائل الإيداع كبيانات غير موثوق بها طوال هذا المسار. إنها مُدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادي، لكنها تفعّل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وControl UI i18n. تشغّل عمليات CI اليدوية المستقلة Android فقط عند `include_android=true`؛ وتفعّل المظلة الكاملة للإصدار Android عبر تمرير `include_android=true`. تُستثنى من CI فحوصات Plugin prerelease الثابتة، وجزء `agentic-plugins` الخاص بالإصدار فقط، والتمشيط الدفعي الكامل للإضافات، ومسارات Docker الخاصة بـ Plugin prerelease. لا تعمل مجموعة Docker prerelease إلا عندما تشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى مجموعة كاملة لمرشح إصدار بسبب تشغيل push أو PR آخر على المرجع نفسه. يتيح مُدخل `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني ضد فرع أو وسم أو SHA إيداع كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمنات السريعة، وفحوصات عقود القنوات المقسمة، وأجزاء `check` باستثناء lint، وتجميعات `check-additional`، ومدققات تجميع اختبارات Node، وفحوصات التوثيق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الإضافات الأخف وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المضمنة، وأجزاء `check-additional`، و`android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس للمعالج بما يكفي لأن 8 vCPU كلّفت أكثر مما وفّرت)؛ وبناء Docker الخاص بـ install-smoke (كلّف وقت انتظار 32-vCPU أكثر مما وفّر)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

يحافظ CI للمستودع الأساسي على Blacksmith كمسار المشغل الافتراضي. أثناء `preflight`، يتحقق `scripts/ci-runner-labels.mjs` من عمليات Actions الحديثة المصطفة وقيد التنفيذ بحثا عن مهام Blacksmith المصطفة. إذا كانت تسمية Blacksmith محددة لديها مهام مصفوفة بالفعل، فإن المهام اللاحقة التي كانت ستستخدم تلك التسمية نفسها تعود إلى المشغل المطابق المستضاف على GitHub (`ubuntu-24.04`، أو `windows-2025`، أو `macos-latest`) لذلك التشغيل فقط. تبقى أحجام Blacksmith الأخرى ضمن عائلة نظام التشغيل نفسها على تسمياتها الأساسية. إذا فشل مسبار API، فلا يطبق أي رجوع احتياطي.

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

يقيس التشغيل اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف الشخصي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند مُدخل `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية ضد وقت تشغيل مبني محليا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: توصيف CPU/heap/trace لنقاط سخونة بدء التشغيل وGateway ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI `openai/gpt-5.4` حقيقية، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحا.

يشغّل مسار mock-provider أيضا مسابر مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت تمهيد Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات hello متكررة لـ `channel-chat-baseline` باستخدام mock-OpenAI؛ وأوامر بدء تشغيل CLI ضد Gateway الممهّد. يوجد ملخص Markdown لمسبار المصدر في `source/index.md` داخل حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار مصنوعات GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ، يودع سير العمل أيضا `report.json`، و`report.md`، والحزم، و`index.md`، ومصنوعات مسبار المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي كـ `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع من أجل "تشغيل كل شيء قبل الإصدار." يقبل فرعا أو وسما أو SHA إيداع كاملا، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات Plugin/package/static/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` من أجل فحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تبقي التشغيلات المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية soak تلك بحيث يظل التحقق الاستشاري الواسع واسعا. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضا `NPM Telegram Beta E2E` ضد مصنوعة `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه ضد حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروقات الملفات الشخصية، والمصنوعات، ومقابض إعادة التشغيل
المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي المغيّر. شغّله
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

لإثبات تثبيت الالتزام على فرع سريع التغير، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال سير عمل GitHub فروعا أو وسوما، وليست قيم SHA خامة للالتزامات. يدفع المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف، ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل `headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال التشغيل. يفشل متحقق المظلة أيضا إذا شغل أي سير عمل فرعي على SHA مختلف.

يتحكم `release_profile` في اتساع الاختبارات الحية/الموفرين الممرر إلى فحوصات الإصدار. تفترض مسارات عمل الإصدار اليدوية `stable` افتراضيا؛ استخدم `full` فقط عندما تريد عمدا مصفوفة الموفر/الوسائط الاستشارية الواسعة. يتحكم `run_release_soak` فيما إذا كانت فحوصات الإصدار المستقرة/الافتراضية تشغل اختبار التحمل الحي/E2E ومسار إصدار Docker الشامل؛ يفرض `full` تشغيل اختبار التحمل.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة الموفر/الخلفية المستقرة.
- يشغل `full` مصفوفة الموفر/الوسائط الاستشارية الواسعة.

تسجل المظلة معرفات التشغيل الفرعية المرسلة، وتعيد مهمة `Verify full validation` النهائية فحص استنتاجات التشغيل الفرعي الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أعيد تشغيل سير عمل فرعي وأصبح أخضر، فأعد تشغيل مهمة متحقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الفرعي الخاص بـ CI الكامل العادي فقط، و`plugin-prerelease` للفرع الفرعي الخاص بالإصدار التمهيدي للـ Plugin فقط، و`release-checks` لكل فروع الإصدار، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على المظلة. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار cross-OS فاشل واحد، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، على سبيل المثال `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية، لذلك تحذر إخفاقات QA فقط لكنها لا تمنع متحقق فحص الإصدار.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى حزمة `release-package-under-test` بصيغة tarball، ثم يمرر ذلك الأثر إلى فحوصات cross-OS وPackage Acceptance، إضافة إلى سير عمل Docker الحي/E2E لمسار الإصدار عندما تعمل تغطية اختبار التحمل. هذا يحافظ على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

عمليات تشغيل `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تستبدل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل فرعي أرسله بالفعل عند إلغاء الأصل، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل فحص إصدار قديم مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## أجزاء حيّة وE2E

يحافظ الفرع الفرعي الحي/E2E للإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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
- أجزاء وسائط صوت/فيديو مقسمة وأجزاء موسيقى مفلترة حسب الموفر

يبقي ذلك تغطية الملفات نفسها مع جعل إخفاقات الموفر الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تبقى أسماء الأجزاء المجمعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق مجموعات الاختبار الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء نموذج/خلفية الاختبار الحي المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المقسمة حسب الموفر، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت دون مهلة مهمة سير العمل، حتى تفشل الحاوية العالقة أو مسار التنظيف بسرعة بدلا من استهلاك كامل ميزانية فحص الإصدار. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فتكوين تشغيل الإصدار خاطئ وسيهدر الوقت الفعلي على عمليات بناء صور مكررة.

## Package Acceptance

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف هذا عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` قيمة `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويعد صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلا من حزم نسخة سير العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يعد سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. تستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. تعمل عندما لا يكون `telegram_mode` هو `none` وتثبت أثر `package-under-test` نفسه عندما يكون Package Acceptance قد حل واحدا؛ لا يزال بإمكان إرسال Telegram مستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشح

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التمهيدية/المستقرة المنشورة.
- يحزم `source=ref` فرع `package_ref` أو وسما أو SHA التزاما كاملا موثوقا. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف HTTPS بصيغة `.tgz`؛ تكون `package_sha256` مطلوبة.
- ينزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي توفيرها للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو التزام المصدر الذي يحزم عند `source=ref`. يتيح ذلك لحزمة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعات

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`، و`cron-mcp-cleanup`، و`openai-web-search-minimal`، و`openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم الملف التعريفي `package` تغطية plugin دون اتصال حتى لا يكون تحقق الحزمة المنشورة معتمدا على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

لسياسة اختبار التحديث وPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار المعد، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. هذا يحافظ على إثبات ترحيل الحزمة، والتحديث، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المكوّن، وPlugin دون اتصال، وplugin-update، وTelegram على tarball الحزمة المحلول نفسه. عيّن `package_acceptance_package_spec` في Full Release Validation أو OpenClaw Release Checks لتشغيل تلك المصفوفة نفسها ضد حزمة npm مشحونة بدلا من الأثر المبني من SHA. لا تزال فحوصات إصدار cross-OS تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بـ Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة لكل تشغيل في مسار الإصدار الحاجب. في Package Acceptance، يكون tarball `package-under-test` المحلول هو المرشح دائما، وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، ويفترض `openclaw@latest` افتراضيا؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يعيّن Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسيع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبتة وتجهيزات على شكل مشكلات لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات Plugin المكوّنة في OpenClaw، ومسارات سجل tilde، وجذور اعتماديات Plugin القديمة الراكدة. تقسّم تحديدات published-upgrade survivor متعددة الخطوط الأساسية حسب الخط الأساسي إلى مهام مشغل Docker مستهدفة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال عن تنظيف تحديث منشور شامل، وليس اتساع Full Release CI العادي. يمكن للتشغيلات المحلية المجمعة تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يكوّن المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مخبوزة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows packaged والمثبت الجديد أيضا من أن حزمة مثبتة تستطيع استيراد تجاوز browser-control من مسار Windows مطلق خام. يفترض اختبار دخان دورة وكيل OpenAI عبر cross-OS القيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

تتضمن Package Acceptance نوافذ توافق مع الإصدارات القديمة محدودة للحزم المنشورة مسبقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` عناصر `pnpm.patchedDependencies` المفقودة من fixture git الوهمي المشتق من tarball، وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات الدخان الخاصة بـ plugin مواقع سجلات التثبيت القديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع استمرار اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات ختم بيانات تعريف البناء المحلي التي شحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` للتأكد من مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وعناصر Docker الأثرية الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار الدخان للتثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. ويقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزم، أو تغييرات حزم/manifest الخاصة بـ plugin المجمعة، أو أسطح plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام دخان Docker. تغييرات plugin المجمعة الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغل e2e لشبكة Gateway للحاوية، ويتحقق من وسيطة بناء امتداد مجمع، ويشغل ملف تعريف Docker الخاص بـ plugin المجمعة المحدود ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- **المسار الكامل** يحتفظ بتثبيت حزمة QR وتغطية Docker/التحديث للمثبت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلا أسطح المثبت/الحزمة/Docker. في الوضع الكامل، يحضر install-smoke أو يعيد استخدام صورة دخان GHCR Dockerfile الجذرية لهدف SHA واحد، ثم يشغل تثبيت حزمة QR، ودخان Dockerfile/Gateway الجذري، ودخان المثبت/التحديث، وDocker E2E السريع الخاص بـ plugin المجمعة كمهام منفصلة حتى لا ينتظر عمل المثبت خلف دخان الصورة الجذرية.

لا تجبر دفعات `main` (بما في ذلك merge commits) المسار الكامل؛ عندما تطلب منطقية نطاق التغيير تغطية كاملة عند الدفع، يحتفظ سير العمل بدخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع دخان مزود الصور لتثبيت Bun العام البطيء لحاجز منفصل عبر `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة مسبقا، وتغليف OpenClaw مرة واحدة كـ tarball npm، وبناء صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبت/التحديث/اعتماديات plugin؛
- صورة وظيفية تثبت tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، وتوجد منطقية المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### متغيرات الضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد فتحات التجمع الرئيسي للمسارات العادية.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد فتحات تجمع الذيل الحساس للمزود.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تخنق المزودات.                                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تدرج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبط `0` لعدم وجود تدرج.           |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيل محددة حدودا أضيق.                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى دخان التنظيف حتى يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن أن يبدأ مسار أثقل من حده الفعال من تجمع فارغ، ثم يعمل منفردا حتى يحرر السعة. تجري عمليات preflight الإجمالية المحلية لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتستمر في حفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة الحية والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. وهو إما يغلف OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل عنصر حزمة أثريا من التشغيل الحالي، أو ينزل عنصر حزمة أثريا من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الحالية بدلا من إعادة البناء. يعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعا تدفق registry/cache العالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker الخاصة بالإصدار كمهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية لـ plugin/runtime. ويظل الاسم المستعار لمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكل من مساري مثبت المزود.

يدمج OpenWebUI ضمن `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط للتشغيلات الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المجمعة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل مدخل `docker_lanes` في سير العمل المسارات المحددة على الصور المحضرة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدودا بمهمة Docker واحدة موجهة ويحضر عنصر الحزمة الأثري أو ينزله أو يعيد استخدامه لذلك التشغيل؛ إذا كان مسار محدد مسارا حيا في Docker، تبني المهمة الموجهة صورة الاختبار الحي محليا لذلك التشغيل المعاد. تتضمن أوامر GitHub المولدة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضرة عندما توجد تلك القيم، بحيث يمكن لمسار فاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## ما قبل إصدار Plugin

`Plugin Prerelease` تغطية منتج/حزمة أعلى تكلفة، لذلك هو سير عمل منفصل يشغله `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية ودفعات `main` وتشغيلات CI اليدوية المستقلة هذه المجموعة متوقفة. يوازن اختبارات plugin المجمعة عبر ثمانية عمال امتدادات؛ تعمل مهام أجزاء الامتدادات تلك حتى مجموعتي إعداد plugin في كل مرة مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات plugin الثقيلة الاستيراد مهام CI إضافية. يجمع مسار ما قبل الإصدار الخاص بـ Docker والمخصص للإصدار فقط مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام تستغرق من دقيقة إلى ثلاث دقائق.

## مختبر QA

يحتوي مختبر QA على مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل تحت أحزمة QA والإصدار العريضة، وليس سير عمل مستقلا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق عريضا.

- يعمل سير عمل `QA-Lab - All Lanes` ليلا على `main` وعند التشغيل اليدوي؛ ويفرع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord إيجارات Convex.

تُشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram باستخدام مزوّد المحاكاة الحتمي والنماذج المؤهلة بالمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطّل Gateway النقل الحي البحث في الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ أما اتصال المزوّد فتغطيه حزم النموذج الحي المنفصلة والمزوّد الأصلي ومزوّد Docker.

يستخدم Matrix ‏`--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعمها CLI الذي تم فحصه. تبقى القيمة الافتراضية لـ CLI ومدخل سير العمل اليدوي `all`؛ ويؤدي تشغيل `matrix_profile=all` يدويًا دائمًا إلى تقسيم تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات QA Lab الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى PRs العادية، اتبع أدلة CI/الفحص المحددة النطاق بدلًا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدًا ماسح أمني ضيق للمرور الأول، وليس مسحًا كاملًا للمستودع. تقوم عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة بفحص كود سير عمل Actions إلى جانب أسطح JavaScript/TypeScript الأعلى مخاطرة باستخدام استعلامات أمنية عالية الثقة مرشحة إلى `security-severity` عالية/حرجة.

يبقى حارس طلب السحب خفيفًا: يبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. تبقى فحوصات CodeQL الخاصة بـ Android وmacOS خارج افتراضيات PR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، الأسرار، الصندوق المعزول، cron، وخط أساس Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية بالإضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android مجدول. يبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. يرفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، ويرشح نتائج بناء التبعيات من SARIF المرفوع، ويرفع تحت `/codeql-critical-security/macos`. يُبقى خارج الافتراضيات اليومية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المقابل. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبمستوى خطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حارس طلب السحب الخاص به أصغر عمدًا من ملف الجدولة: تشغّل PRs غير المسودة فقط أجزاء `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الرد، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/الصندوق المعزول/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/غراء SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تشغّل تغييرات إعداد CodeQL وسير عمل الجودة جميع أجزاء جودة PR الاثني عشر.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي خطافات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                   | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود المصادقة، والأسرار، والصندوق المعزول، وcron، وحد أمان Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات، والترحيل، والتطبيع، وعقود الإدخال والإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النموذج/المزوّد، وإرسال الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات إشراف العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسة |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الرد الوارد في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضيات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود نقطة دخول المحمّل، والسجل، والسطح العام، وPlugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة وقياسها وتعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسيع CodeQL لـ Swift وPython وPlugin المضمّنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الضيقة مستقرة في زمن التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت مؤخرًا. ليس لديه جدول خالص: يمكن لتشغيل CI ناجح على `main` بعد دفع من غير روبوت أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات workflow-run عندما يكون `main` قد تقدم أو عندما يكون تشغيل Docs Agent آخر غير متخطى قد أُنشئ خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزام من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي جميع تغييرات main المتراكمة منذ آخر مرور على المستندات.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. ليس لديه جدول خالص: يمكن لتشغيل CI ناجح على `main` بعد دفع من غير روبوت أن يطلقه، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد شُغّل أو كان قيد التشغيل في ذلك اليوم حسب UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمّعًا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل أن يُلتزم بأي شيء. عندما يتقدم `main` قبل هبوط دفع الروبوت، يعيد المسار تطبيق الرقعة المتحققة فوقه، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع السلامة نفسه المتجنب لـ sudo مثل وكيل المستندات.

### PRs مكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف النسخ المكررة بعد الهبوط. قيمته الافتراضية تشغيل تجريبي، ولا يغلق إلا PRs المدرجة صراحة عندما يكون `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الهابط مدموج وأن لكل نسخة مكررة إما مشكلة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

يعيش منطق مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وينفذه `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات الإنتاج في النواة تشغّل فحص أنواع إنتاج النواة واختبارات النواة بالإضافة إلى فحص lint والحراس للنواة؛
- تغييرات اختبارات النواة فقط تشغّل فحص أنواع اختبارات النواة فقط بالإضافة إلى فحص lint للنواة؛
- تغييرات الإنتاج في الإضافات تشغّل فحص أنواع إنتاج الإضافات واختبارات الإضافات بالإضافة إلى فحص lint للإضافات؛
- تغييرات اختبارات الإضافات فقط تشغّل فحص أنواع اختبارات الإضافات بالإضافة إلى فحص lint للإضافات؛
- تغييرات Plugin SDK العام أو plugin-contract تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود النواة هذه (تبقى عمليات مسح إضافات Vitest عملا اختباريا صريحا)؛
- زيادات الإصدارات الخاصة ببيانات تعريف الإصدار فقط تشغّل فحوصات مستهدفة للإصدار/الإعدادات/اعتماديات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يوجد توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر التعيينات الصريحة، ثم اختبارات الأشقاء والاعتماديات في مخطط الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد التعيينات الصريحة: التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم ردود المصدر، أو مسار مطالبة نظام أداة الرسائل تمر عبر اختبارات رد النواة بالإضافة إلى اختبارات تراجع التسليم في Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا على مستوى الحزمة الاختبارية لدرجة أن المجموعة الرخيصة المعينة ليست بديلا موثوقا.

## التحقق باستخدام Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقا جديدا مجهزا مسبقا للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على غير المتوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات جذر مطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وجهز صندوقا جديدا بدلا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs الحذف الكبير المقصودة، اضبط `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذلك.

ينهي `pnpm testbox:run` أيضا استدعاء Blacksmith CLI محليا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروق المحلية الكبيرة على غير المعتاد.

Crabbox هو غلاف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص واسعا جدا لحلقة تعديل محلية، أو عندما يهم التوافق مع CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات الحزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. الواجهة الخلفية العادية لـ OpenClaw هي `blacksmith-testbox`؛ وسعة AWS/Hetzner المملوكة هي بديل احتياطي عند أعطال Blacksmith، أو مشكلات الحصة، أو اختبار السعة المملوكة صراحة.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملفا تنفيذيا قديما من Crabbox لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحة رغم أن `.crabbox.yaml` يحتوي على افتراضيات owned-cloud.

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. يجب أن توقف عمليات Crabbox أحادية التشغيل المدعومة من Blacksmith الـ Testbox تلقائيا؛ إذا انقطع تشغيل أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدا إلى أوامر متعددة على الصندوق المجهز نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت الطبقة المعطلة هي Crabbox لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرة كبديل احتياطي ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات التجهيز الجديدة تبقى في حالة `queued` دون IP أو URL لتشغيل Actions بعد بضع دقائق، فتعامل مع ذلك كضغط على مزوّد Blacksmith أو الطابور أو الفوترة أو حدود المؤسسة. أوقف معرفات الطابور التي أنشأتها، وتجنب بدء المزيد من Testboxes، وانقل الإثبات إلى مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة تحكم Blacksmith والفوترة وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحة:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot أو On-Demand Standard الإقليمية. تضبط `.crabbox.yaml` المملوكة للمستودع افتراضيا `standard`، وعدة مناطق سعة، و`capacity.hints: true` حتى تطبع إيجارات AWS المتوسَّطة المنطقة/السوق المحددين، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئة عالية الضغط. استخدم `fast` للفحوصات الواسعة الأثقل، و`large` فقط بعد أن لا تكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المقيدة بالمعالج مثل الحزمة الكاملة أو مصفوفات Docker لكل Plugins، أو تحقق إصدار/حاجب صريح، أو تحليل أداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed`، أو الاختبارات المركزة، أو عمل الوثائق فقط، أو lint/فحص الأنواع العادي، أو إعادة إنتاج E2E صغيرة، أو فرز عطل Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط تقلب سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` افتراضيات المزوّد والمزامنة وترطيب GitHub Actions لمسارات owned-cloud. تستثني `.git` المحلي كي يحافظ checkout الخاص بـ Actions المجهز على بيانات Git الوصفية البعيدة الخاصة به بدلا من مزامنة remotes ومخازن الكائنات المحلية للمشرف، وتستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدا. يمتلك `.github/workflows/crabbox-hydrate.yml` إجراءات checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتمرير البيئة غير السرية لأوامر owned-cloud `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

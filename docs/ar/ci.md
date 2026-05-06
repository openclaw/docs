---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة التكامل المستمر أو عدم تشغيلها
    - أنت تعمل على تصحيح أخطاء فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو تمرير نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-05-06T09:02:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

تشغّل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفرق وتعطّل المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز تشغيلات `workflow_dispatch` اليدوية بوعي النطاق الذكي وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تقع تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                              | الغرض                                                                                                   | متى تعمل                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI                   | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف القفل الإنتاجي بلا اعتماديات مقابل تحذيرات npm                                          | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip الإنتاجي الخاص بالاعتماديات فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة التحكم، وفحوصات الآثار المبنية، والآثار القابلة لإعادة الاستخدام لاحقًا                       | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات المضمن/عقد Plugin/البروتوكول                              | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                                      | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والمضمن والعقود والامتدادات                          | تغييرات ذات صلة بـ Node              |
| `check`                          | المكافئ المجزأ للبوابة المحلية الرئيسية: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، وفحص الدخان الصارم                | تغييرات ذات صلة بـ Node              |
| `check-additional`               | المعمارية، وانحراف الحدود/المطالبات المجزأ، وحراس الامتدادات، وحدود الحزم، ومراقبة Gateway        | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات دخان CLI المبنية ودخان ذاكرة بدء التشغيل                                                            | تغييرات ذات صلة بـ Node              |
| `checks`                         | متحقق لاختبارات القنوات للآثار المبنية                                                                 | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء ودخان توافق Node 22                                                                | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق الوثائق وفحصها وفحوصات الروابط المعطلة                                                             | تغيّرت الوثائق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                    | تغييرات ذات صلة بـ Skills في Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة                      | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام الآثار المبنية المشتركة                                               | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | فحص Swift والبناء والاختبارات لتطبيق macOS                                                            | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدات Android لكلا النكهتين إضافة إلى بناء APK تصحيحي واحد                                              | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                 | نجاح CI الرئيسي أو تشغيل يدوي |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات مزود وهمي، وتحليل عميق، وGPT 5.4 حي | مجدول وتشغيل يدوي      |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات توجد أصلًا. منطق `docs-scope` و`changed-scope` هو خطوات داخل هذه المهمة، وليس مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام الآثار الثقيلة ومصفوفة المنصات.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة لكي يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات تجميع الأجزاء `!cancelled() && always()` بحيث تستمر في الإبلاغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي مُرقّم بالإصدار (`CI-v7-*`) بحيث لا يستطيع كائن GitHub عالق في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

## النطاق والتوجيه

يقع منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيّرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى فحص سير العمل، لكنها لا تفرض وحدها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات محددة النطاق لتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات مختارة لرُقم اختبارات core-test الرخيصة، وتعديلات ضيقة لمساعدات/توجيه اختبارات عقود Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمنة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدات التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق لمغلّفات العمليات/المسارات الخاصة بـ Windows، ومساعدات تشغيل npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير ذات الصلة، وPlugin، ودخان التثبيت، والاختبارات فقط على مسارات Linux Node.

تُقسَّم أو تُوازَن عائلات اختبارات Node الأبطأ بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمنفذين: تعمل عقود القنوات بثلاثة أجزاء موزونة، وتعمل مسارات core unit fast/support بشكل منفصل، وتُقسَّم بنية وقت تشغيل النواة بين أجزاء الحالة والعمليات/الإعدادات، ويعمل الرد التلقائي كعمال متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسَّم إعدادات Gateway/الخادم الوكيلة عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلًا من انتظار الآثار المبنية. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من ملتقط Plugin المشترك العام. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل من جزء مُرشّح. يحافظ `check-additional` على عمل تجميع/اختبار حدود الحزمة معًا ويفصل معمارية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُقسَّم قائمة حراس الحدود عبر أربعة أجزاء مصفوفة، يشغّل كل منها حراسًا مستقلة مختارة بالتوازي ويطبع توقيتات لكل فحص، بما في ذلك `pnpm prompt:snapshots:check` بحيث يُثبّت انحراف مطالبات مسار Codex السعيد في وقت التشغيل على طلب السحب الذي سببه. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم النواة بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تملك نكهة الجهات الخارجية مجموعة مصدر أو بيانًا منفصلًا؛ لا يزال مسار اختبارات وحداتها يجمع النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة حزم APK تصحيحي مكرر عند كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip إنتاجي خاص بالاعتماديات فقط ومثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر الإصدار في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج ملفات الإنتاج غير المستخدمة من Knip مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مُراجع أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلب سحب غير موثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام عند الدفعات إلى `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مُطبَّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المُطبَّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطلبه ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للتنفيذ أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. يجب أن تؤدي الفتحات الروتينية، والتعديلات، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تعمل عمليات تشغيل CI اليدوية برسم الوظائف نفسه مثل CI العادي، لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وتدويل واجهة Control UI. تعمل عمليات تشغيل CI اليدوية المستقلة على Android فقط باستخدام `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وجزء `agentic-plugins` الخاص بالإصدار فقط، والمسح الدفعي الكامل للإضافات، ومسارات Docker لما قبل إصدار Plugin. لا تعمل مجموعة Docker لما قبل الإصدار إلا عندما يطلق `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى مجموعة مرشح إصدار كاملة بسبب تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدع موثوق تشغيل ذلك الرسم على فرع أو وسم أو SHA كامل للالتزام مع استخدام ملف سير العمل من مرجع الإطلاق المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | الوظائف                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، وظائف الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، فحوصات البروتوكول/العقود/المضمنة السريعة، فحوصات عقود القنوات المجزأة، أجزاء `check` باستثناء lint، تجميعات `check-additional`، محققات تجميع اختبارات Node، فحوصات التوثيق، Python skills، workflow-sanity، labeler، auto-response؛ كما يستخدم فحص تمهيدي install-smoke Ubuntu مستضافا على GitHub حتى يمكن لمصفوفة Blacksmith الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، أجزاء الإضافات الأقل وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، أجزاء اختبارات Linux Node، أجزاء اختبارات Plugin المضمنة، أجزاء `check-additional`، `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي للمعالج بحيث كلفت 8 vCPU أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلف وقت انتظار 32-vCPU أكثر مما وفر)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

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

يقيس الإطلاق اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة ومؤشرات الأحدث بحسب المرجع المختبر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرار، ومرشحات السيناريو.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليا مع مصادقة OpenAI متوافقة وهمية وحتمية.
- `mock-deep-profile`: تحليل أداء CPU/heap/trace لنقاط بدء التشغيل، وGateway، ومواطن بطء دورات الوكيل.
- `live-gpt54`: دورة وكيل OpenAI `openai/gpt-5.4` حقيقية، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحا.

يشغل مسار mock-provider أيضا مجسات مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات ترحيب `channel-chat-baseline` مكررة باستخدام mock-OpenAI؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار مصنوعات GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ، يثبت سير العمل أيضا `report.json`، و`report.md`، والحزم، و`index.md`، ومصنوعات مجسات المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلي لعبارة "شغّل كل شيء قبل الإصدار". يقبل فرعا أو وسما أو SHA كامل للالتزام، ويطلق سير عمل `CI` اليدوي بذلك الهدف، ويطلق `Plugin Prerelease` لإثبات Plugin/الحزمة/الفحوصات الثابتة/Docker الخاص بالإصدار فقط، ويطلق `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزم عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تبقي عمليات التشغيل المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية التحمل هذه حتى يبقى التحقق الواسع من التنبيهات واسعا. مع `rerun_group=all` و`release_profile=full`، يشغل أيضا `NPM Telegram Beta E2E` مقابل مصنوع `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، وفروق الملفات التعريفية، والمصنوعات، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يجري تغييرات. أطلقه
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح فحص
OpenClaw npm التمهيدي. يتحقق من `pnpm plugins:sync:check`،
ويطلق `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويطلق
`Plugin ClawHub Release` للـ SHA نفسه الخاص بالإصدار، وبعد ذلك فقط يطلق
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إطلاق سير عمل GitHub فروعا أو وسوما، وليست SHAs خاما للالتزامات. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويطلق `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل محقق المظلة أيضا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

`release_profile` يتحكم في نطاق المزودين/الاختبارات الحية المُمرَّر إلى فحوصات الإصدار. تعتمد سير عمل الإصدار اليدوية افتراضيًا على `stable`؛ استخدم `full` فقط عندما تريد عمدًا مصفوفة المزودين/الوسائط الاستشارية الواسعة. يتحكم `run_release_soak` فيما إذا كانت فحوصات الإصدار المستقرة/الافتراضية تشغّل اختبار التحمل الشامل للمسار الحي/E2E ومسار إصدار Docker؛ ويجبر `full` تشغيل اختبار التحمل.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزودين/الخلفيات المستقرة.
- يشغّل `full` مصفوفة المزودين/الوسائط الاستشارية الواسعة.

يسجل التشغيل الجامع معرّفات تشغيل الأبناء التي تم إطلاقها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وتحول إلى أخضر، فأعد تشغيل مهمة التحقق الأصلية فقط لتحديث نتيجة التشغيل الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لطفل CI الكامل العادي فقط، و`plugin-prerelease` لطفل ما قبل إصدار Plugin فقط، و`release-checks` لكل طفل إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على التشغيل الجامع. هذا يُبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار واحد فاشل عبر أنظمة التشغيل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثل `windows/packaged-upgrade`؛ تصدر أوامر أنظمة التشغيل الطويلة أسطر Heartbeat، وتتضمن ملخصات الترقية المعبأة توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية، لذا تُصدر إخفاقات QA فقط تحذيرًا لكنها لا تحجب متحقق فحوصات الإصدار.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك الأثر إلى فحوصات أنظمة التشغيل وقبول الحزمة، إضافة إلى سير عمل Docker لمسار الإصدار الحي/E2E عند تشغيل تغطية التحمل. هذا يُبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة تعبئة المرشح نفسه في عدة مهام أبناء.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all` تستبدل التشغيل الجامع الأقدم. يلغي مراقب الأصل أي سير عمل ابن كان قد أطلقه عندما يُلغى الأصل، لذلك لا يقف تحقق main الأحدث خلف تشغيل فحوصات إصدار قديم لمدة ساعتين. يحتفظ تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة بـ `cancel-in-progress: false`.

## أجزاء الاختبارات الحية وE2E

يحافظ طفل الإصدار الحي/E2E على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلاً من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المفلترة حسب المزود
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- أجزاء وسائط صوت/فيديو مقسمة وأجزاء موسيقى مفلترة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات المزودين الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الأجزاء التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط الحية الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة `ffmpeg` و`ffprobe` مسبقًا؛ وتتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ الحزم الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لإطلاق اختبارات Docker متداخلة.

تستخدم أجزاء النماذج/الخلفيات الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المقسمة حسب المزود، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل، بحيث يفشل مسار حاوية عالقة أو تنظيف عالق بسرعة بدلاً من استهلاك ميزانية فحص الإصدار كلها. إذا أعادت هذه الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ خطأ وسيهدر وقت التشغيل على بناء صور مكرر.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. تتحقق `resolve_package` من `workflow_ref`، وتحل مرشح حزمة واحدًا، وتكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، وتكتب `.artifacts/docker-e2e-package/package-candidate.json`، وترفع كليهما كأثر `package-under-test`، وتطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` ملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون الأرشيف، ويحضّر صور Docker ذات ملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلاً من تعبئة نسخة سير العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية بآثار فريدة.
3. تستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. تعمل عندما لا يكون `telegram_mode` هو `none` وتثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحدًا؛ ولا يزال بإمكان إطلاق Telegram المستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول ما قبل الإصدار/الإصدار المستقر المنشور.
- يعبئ `source=ref` فرعًا أو وسمًا أو SHA التزام كاملاً من `package_ref` موثوق. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويعبئه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عبر HTTPS؛ ويكون `package_sha256` مطلوبًا.
- ينزل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختياريًا لكن ينبغي توفيره للآثار المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو التزام المصدر الذي يُعبأ عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزم

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`، و`cron-mcp-cleanup`، و`openai-web-search-minimal`، و`openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin دون اتصال حتى لا يعتمد تحقق الحزمة المنشورة على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإطلاقات المستقلة.

لسياسة اختبار التحديثات وPlugin المخصصة، بما في ذلك الأوامر المحلية، ومسارات Docker، ومدخلات قبول الحزمة، وافتراضات الإصدار، وفرز الإخفاقات، راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. هذا يُبقي إثبات ترحيل الحزمة، والتحديث، وتنظيف تبعيات Plugin القديمة، وإصلاح تثبيت Plugin المهيأ، وPlugin دون اتصال، وتحديث Plugin، وTelegram على أرشيف الحزمة المحلول نفسه. اضبط `package_acceptance_package_spec` على التحقق الكامل من الإصدار أو فحوصات إصدار OpenClaw لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلاً من الأثر المبني من SHA. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي سلوك التهيئة، والمثبت، والمنصة الخاص بأنظمة التشغيل؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاجب. في قبول الحزمة، يكون أرشيف `package-under-test` المحلول هو المرشح دائمًا، ويحدد `published_upgrade_survivor_baseline` الأساس المنشور الاحتياطي، مع قيمة افتراضية `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الأساس. يضبط التحقق الكامل من الإصدار مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبتة ومثبتات على شكل مشكلات لإعداد Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المهيأة، ومسارات سجلات التلدة، وجذور تبعيات Plugin القديمة الراكدة. تُقسم تحديدات ناجي الترقية المنشورة متعددة الأسس حسب الأساس إلى مهام مشغل Docker مستهدفة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديث المنشور الشامل، وليس نطاق CI الكامل للإصدار العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور الأساس بوصفة أمر `openclaw config set` مضمّنة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows المعبأة ومسارات المثبت النظيفة أيضًا من أن الحزمة المثبتة تستطيع استيراد تجاوز تحكم المتصفح من مسار Windows مطلق خام. يعتمد اختبار دخان دورة وكيل OpenAI عبر أنظمة التشغيل افتراضيًا على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x الافتراضية.

### نوافذ التوافق القديم

يملك قبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة بالفعل. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من الأرشيف؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من مثبت git الوهمي المشتق من الأرشيف، وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات Plugin الدخانية مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذّر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات ختم بيانات وصفية للبناء المحلي كانت قد شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ إذ تفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها و SHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` ونتاجات Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار سلامة التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. ويقسّم تغطية اختبار السلامة إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمّنة، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمرّنها مهام اختبار Docker السريعة. تغييرات Plugins المضمّنة على مستوى المصدر فقط، والتعديلات الخاصة بالاختبارات فقط، والتعديلات الخاصة بالوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويفحص CLI، ويشغّل اختبار CLI السريع لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل e2e لشبكة Gateway داخل الحاوية، ويتحقق من وسيطة بناء إضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود للـPlugin المضمّن تحت مهلة إجمالية للأوامر قدرها 240 ثانية (مع تقييد كل تشغيل Docker لكل سيناريو على حدة).
- **المسار الكامل** يحتفظ بتغطية تثبيت حزمة QR وDocker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والإرسال اليدوي، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة اختبار سلامة Dockerfile الجذر من GHCR لرقم SHA الهدف، ثم يشغّل تثبيت حزمة QR، واختبارات سلامة Dockerfile/Gateway الجذر، واختبارات سلامة المثبّت/التحديث، وDocker E2E السريع للـPlugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف اختبارات سلامة الصورة الجذرية.

دفعات `main` (بما في ذلك commits الدمج) لا تفرض المسار الكامل؛ فعندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يحتفظ سير العمل باختبار سلامة Docker السريع ويترك اختبار سلامة التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

اختبار سلامة مزود الصور لتثبيت Bun العام البطيء محكوم بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل في الجدولة الليلية ومن سير عمل فحوصات الإصدار، ويمكن لإرسالات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـQR والمثبّت بملفات Dockerfile الخاصة بها والمركّزة على التثبيت.

## Docker E2E محلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة مسبقا، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git عارٍ لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت الأرشيف نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المختارة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### إعدادات قابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد فتحات الحوض الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد فتحات الحوض اللاحق الحسّاس للمزوّد.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة كي لا يقيّد المزوّدون المعدل.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التدرج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم التدرج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حيّة/لاحقة مختارة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى اختبار سلامة التنظيف كي يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حدّه الفعلي أن يبدأ مع ذلك من حوض فارغ، ثم يعمل منفردا حتى يحرر السعة. تقوم الفحوصات المسبقة المحلية الإجمالية بفحص Docker، وإزالة حاويات OpenClaw E2E القديمة، وإصدار حالة المسارات النشطة، وحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف عن جدولة مسارات مجمّعة جديدة بعد أول فشل افتراضيا.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة الحية والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. فهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل نتاج حزمة من التشغيل الحالي، أو ينزّل نتاج حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون الأرشيف؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية من GHCR الموسومة بملخص الحزمة عبر ذاكرة طبقة Docker المؤقتة في Blacksmith عندما تحتاج الخطة إلى مسارات ذات حزمة مثبتة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو الصور الموجودة ذات ملخص الحزمة بدلا من إعادة البناء. تعاد محاولات سحب صور Docker بمهلة محددة قدرها 180 ثانية لكل محاولة، بحيث يعاد بسرعة تدفق registry/cache العالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار في مهام مجزأة أصغر مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة إجمالية للـPlugin/وقت التشغيل. ويظل الاسم المستعار لمسار `install-e2e` اسم إعادة التشغيل اليدوية الإجمالي لكلا مساري مثبّت المزوّد.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط للإرسالات الخاصة بـOpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في سير العمل المسارات المختارة مقابل الصور المجهزة بدلا من مهام الأجزاء، ما يحصر تصحيح المسار الفاشل في مهمة Docker مستهدفة واحدة، ويجهّز أو ينزّل أو يعيد استخدام نتاج الحزمة لذلك التشغيل؛ إذا كان المسار المختار مسار Docker حيّا، تبني المهمة المستهدفة صورة الاختبار الحي محليا لإعادة التشغيل تلك. تتضمن أوامر GitHub المولدة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصورة المجهزة عندما توجد تلك القيم، بحيث يمكن للمسار الفاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## ما قبل إصدار Plugin

`Plugin Prerelease` هي تغطية منتج/حزمة أعلى تكلفة، لذلك فهي سير عمل منفصل يرسله `Full Release Validation` أو مشغّل صريح. تبقي طلبات السحب العادية ودفعات `main` وإرسالات CI اليدوية المستقلة تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال إضافات؛ وتشغّل مهام أجزاء الإضافات تلك ما يصل إلى مجموعتي إعداد Plugin في كل مرة مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر، كي لا تنشئ دفعات Plugins كثيفة الاستيراد مهام CI إضافية. يجمع مسار ما قبل إصدار Docker الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام مدتها دقيقة إلى ثلاث دقائق.

## QA Lab

لدى QA Lab مسارات CI مخصصة خارج سير العمل الذكي ذي النطاق الرئيسي. يكون تكافؤ الوكلاء متداخلا تحت أحزمة QA والإصدار الواسعة، وليس سير عمل PR مستقلا. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسع.

- يشغّل سير عمل `QA-Lab - All Lanes` ليليا على `main` وعند الإرسال اليدوي؛ ويفرّع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مسارات النقل الحية لـMatrix وTelegram مع المزوّد الوهمي الحتمي والنماذج المؤهلة للوهم (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطّل Gateway النقل الحي البحث في الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة على نحو منفصل؛ وتغطي اتصال المزوّد مجموعات النموذج الحي والمزوّد الأصلي ومزوّد Docker المنفصلة.

يستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مضيفا `--fail-fast` فقط عندما يدعم CLI الذي تم checkout له ذلك. يظل الافتراضي في CLI ومدخل سير العمل اليدوي `all`؛ ودائما ما يجزئ إرسال `matrix_profile=all` اليدوي تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزمتَي المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا النتاجين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى PRs العادية، اتبع أدلة CI/الفحص المحددة النطاق بدلا من التعامل مع parity كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدا ماسح أمان ضيق للمرور الأول، وليس مسحا كاملا للمستودع. تفحص عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرا باستخدام استعلامات أمان عالية الثقة مصفاة إلى `security-severity` العالية/الحرجة.

تبقى حراسة طلبات السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. تبقى CodeQL الخاصة بـ Android وmacOS خارج افتراضات PR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وsandbox، وcron، وخط أساس gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القناة، وgateway، وPlugin SDK، والأسرار، ونقاط لمس التدقيق                 |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وweb-fetch، وسياسة SSRF في Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                        |

### شرائح الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شريحة أمان Android مجدولة. تبني تطبيق Android يدويا لأجل CodeQL على أصغر مشغل Blacksmith Linux تقبله سلامة سير العمل. ترفع ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شريحة أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا لأجل CodeQL على Blacksmith macOS، وتصفي نتائج بناء التبعيات من SARIF المرفوع، وترفع ضمن `/codeql-critical-security/macos`. تبقى خارج الافتراضات اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشريحة غير الأمنية المطابقة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة خطأ، على أسطح ضيقة عالية القيمة على مشغل Blacksmith Linux الأصغر. حراسة طلبات السحب الخاصة بها أصغر عمدا من الملف الشخصي المجدول: PRs غير المسودة تشغل فقط الشرائح المطابقة `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوجيه الردود، وكود مخطط/ترحيل/IO للإعدادات، وكود المصادقة/الأسرار/sandbox/الأمان، ووقت تشغيل القنوات الأساسية وPlugin القناة المضمنة، وبروتوكول gateway/طريقة الخادم، ووقت تشغيل الذاكرة/غراء SDK، وMCP/العملية/التسليم الصادر، ووقت تشغيل المزود/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تشغل تغييرات إعداد CodeQL وسير عمل الجودة كل شرائح جودة PR الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الشخصية الضيقة هي خطافات تعليم/تكرار لتشغيل شريحة جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، والأسرار، وsandbox، وcron، وgateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، وIO                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القنوات الأساسية وPlugin القناة المضمنة                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت تشغيل تنفيذ الأوامر، وتوجيه النموذج/المزود، وتوجيه الرد التلقائي وطوابيره، ومستوى التحكم ACP                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، وواجهات وقت تشغيل الذاكرة، وأسماء مستعارة لذاكرة Plugin SDK، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر doctor للذاكرة                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسة                           |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الرد، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزود واكتشافه، وتسجيل وقت تشغيل المزود، وافتراضات/كتالوجات المزود، وسجلات الويب/البحث/الجلب/التضمين                            |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل جلب/بحث الويب الأساسية، وIO الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                                   |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة plugin                                                                                                    |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون إخفاء إشارة الأمان. يجب إعادة إضافة توسيع CodeQL لـ Swift وPython وPlugin المضمنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الشخصية الضيقة مستقرة في وقت التشغيل والإشارة.

## مهام سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت حديثا. ليس له جدول صرف: يمكن لتشغيل CI ناجح من دفع غير بوت على `main` أن يشغله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات workflow-run عندما يكون `main` قد تقدم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أنشئ خلال الساعة الأخيرة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، لذلك يمكن لتشغيل واحد كل ساعة تغطية كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. ليس له جدول صرف: يمكن لتشغيل CI ناجح من دفع غير بوت على `main` أن يشغله، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد عمل أو يعمل بالفعل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبارات صغيرة فقط مع الحفاظ على التغطية بدلا من عمليات refactor واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يمكن لـ Codex إصلاح الإخفاقات الواضحة فقط ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل أن يلتزم بأي شيء. عندما يتقدم `main` قبل وصول دفع البوت، يعيد المسار تأسيس الرقعة المحققة، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ يتم تخطي الرقع القديمة المتعارضة. يستخدم GitHub-hosted Ubuntu حتى يتمكن إجراء Codex من الحفاظ على وضعية أمان drop-sudo نفسها مثل وكيل المستندات.

### PRs مكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. افتراضيا يعمل بوضع dry-run ولا يغلق إلا PRs المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الواصل مدمج وأن كل نسخة مكررة لديها إما مشكلة مشار إليها مشتركة أو مقاطع تغيير متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطق مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتنفذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج core تشغل typecheck لإنتاج core واختبارات core إضافة إلى lint/guards الخاصة بـ core؛
- تغييرات اختبارات core فقط تشغل فقط typecheck لاختبارات core إضافة إلى lint الخاص بـ core؛
- تغييرات إنتاج extension تشغل typecheck لإنتاج extension واختبارات extension إضافة إلى lint الخاص بـ extension؛
- تغييرات اختبارات extension فقط تشغل typecheck لاختبارات extension إضافة إلى lint الخاص بـ extension؛
- تغييرات Plugin SDK العامة أو عقد plugin تتوسع إلى typecheck لـ extension لأن extensions تعتمد على عقود core هذه (تبقى عمليات مسح Vitest للـ extension عملا اختباريا صريحا)؛
- زيادات إصدار metadata الخاصة بالإصدار فقط تشغل فحوص إصدار/إعدادات/تبعية جذرية مستهدفة؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو عمدا أرخص من `check:changed`: تعديلات الاختبار المباشرة تشغل نفسها، وتعديلات المصدر تفضل الخرائط الصريحة، ثم اختبارات الأشقاء والاعتمادات في مخطط الاستيراد. إعداد تسليم غرف المجموعات المشترك هو أحد الخرائط الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو نمط تسليم رد المصدر، أو موجه نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى تراجعات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا بما يكفي على مستوى العدة بحيث لا تكون المجموعة الرخيصة المعينة وكيلا موثوقا.

## التحقق باستخدام Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا تم تسخينه مسبقًا للإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة سريعًا عندما تختفي ملفات جذر مطلوبة مثل `pnpm-lock.yaml` أو عندما يُظهر `git status --short` ما لا يقل عن 200 حذف متعقب. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من طلب السحب؛ أوقف ذلك الصندوق وسخّن صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى طلبات السحب التي تتضمن حذفًا كبيرًا مقصودًا، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو مغلّف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص أوسع من أن يناسب حلقة تعديل محلية، أو عندما تكون مطابقة CI مهمة، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات الحزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. خلفية OpenClaw العادية هي `blacksmith-testbox`؛ وتُعد سعة AWS/Hetzner المملوكة خيارًا احتياطيًا عند انقطاعات Blacksmith، أو مشكلات الحصة، أو الاختبار الصريح على السعة المملوكة.

قبل أول تشغيل، افحص المغلّف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض مغلّف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً حتى إن كانت `.crabbox.yaml` تحتوي على افتراضيات السحابة المملوكة.

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. ينبغي أن توقف تشغيلات Crabbox أحادية اللقطة المدعومة من Blacksmith صندوق Testbox تلقائيًا؛ إذا قوطع تشغيل أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف الصناديق التي أنشأتها فقط:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق نفسه بعد تهيئته:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت Crabbox هي الطبقة المعطّلة بينما يعمل Blacksmith نفسه، فاستخدم Blacksmith مباشرةً كخيار احتياطي ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو مقيّدًا بالحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تملك `.crabbox.yaml` افتراضيات المزوّد والمزامنة والتهيئة عبر GitHub Actions لمسارات السحابة المملوكة. وهي تستبعد `.git` المحلي بحيث يحتفظ checkout المهيأ من Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرف، كما تستبعد آثار وقت التشغيل/البناء المحلية التي ينبغي عدم نقلها أبدًا. تملك `.github/workflows/crabbox-hydrate.yml` خطوات checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

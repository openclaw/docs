---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح فحصًا فاشلًا في GitHub Actions
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-05-05T06:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

يشغّل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروق وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز تشغيلات `workflow_dispatch` اليدوية النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugins الخاصة بالإصدارات فقط في سير عمل [`Plugin ما قبل الإصدار`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`التحقق الكامل من الإصدار`](#full-release-validation) أو إرسال يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                              | الغرض                                                                                                   | متى تعمل                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI                   | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف القفل الإنتاجي دون تبعيات مقابل إرشادات npm الأمنية                                          | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip للإنتاج الخاص بالتبعيات فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة التحكم، وفحوصات مخرجات البناء، ومخرجات قابلة لإعادة الاستخدام للمراحل اللاحقة                       | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات المجمّع/عقد Plugin/البروتوكول                              | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى أجزاء مع نتيجة فحص تجميعية ثابتة                                      | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، مع استبعاد مسارات القنوات، والمجمّعات، والعقود، والامتدادات                          | تغييرات ذات صلة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والـ lint، والحراس، وأنواع الاختبارات، واختبار smoke صارم                | تغييرات ذات صلة بـ Node              |
| `check-additional`               | البنية، وانجراف الحدود/المطالبات المقسم، وحراس الامتدادات، وحدود الحزم، ومراقبة Gateway        | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات smoke للـ CLI المبني وSmoke لذاكرة بدء التشغيل                                                            | تغييرات ذات صلة بـ Node              |
| `checks`                         | متحقق لاختبارات القنوات الخاصة بمخرجات البناء                                                                 | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء وتحقق smoke للتوافق مع Node 22                                                                | إرسال CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق التوثيق، وlint، وفحوصات الروابط المعطلة                                                             | عند تغيّر التوثيق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                    | تغييرات ذات صلة بـ Skills في Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows، إضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة                      | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام مخرجات البناء المشتركة                                               | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | Swift lint، والبناء، والاختبارات لتطبيق macOS                                                            | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلا النكهتين، إضافة إلى بناء APK تصحيح واحد                                              | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                 | نجاح CI الرئيسي أو إرسال يدوي |
| `openclaw-performance`           | تقارير أداء يومية/عند الطلب لوقت تشغيل Kova مع مسارات موفر وهمي، وملف تعريف عميق، وGPT 5.4 مباشر | إرسال مجدول ويدوي      |

## ترتيب الفشل السريع

1. تقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهامًا مستقلة.
2. تفشل `security-scm-fast`، و`security-dependency-audit`، و`security-fast`، و`check`، و`check-additional`، و`check-docs`، و`skills-python` سريعًا دون انتظار مهام المصفوفة الأثقل الخاصة بالمخرجات والمنصات.
3. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد أن يصبح البناء المشترك جاهزًا.
4. تتوسع بعد ذلك مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core`، و`checks-fast-contracts-channels`، و`checks-node-core-test`، و`checks`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`android`.

قد يعلّم GitHub المهام التي تجاوزها دفع أحدث على نفس طلب السحب أو مرجع `main` بأنها `cancelled`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل لنفس المرجع يفشل أيضًا. تستخدم فحوصات تجميع الأجزاء `!cancelled() && always()` حتى تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل كله قد تم تجاوزه بالفعل. مفتاح التزامن التلقائي لـ CI ذو إصدار (`CI-v7-*`) بحيث لا يستطيع عالق من جهة GitHub في مجموعة طابور قديمة أن يحظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى الإرسال اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى lint لسير العمل، لكنها لا تفرض وحدها عمليات بناء Windows أو Android أو macOS الأصلية؛ تبقى مسارات المنصات هذه مقيدة بتغييرات مصدر المنصة.
- **تعديلات التوجيه فقط في CI، وتعديلات محددة رخيصة على تجهيزات اختبارات النواة، وتعديلات ضيقة على مساعدات/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريعًا لـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى هذا المسار مخرجات البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المجمعة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدات التي تختبرها المهمة السريعة مباشرة.
- **فحوصات Windows Node** مقيدة بأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغلات npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر، وPlugin، وinstall-smoke، والتغييرات الخاصة بالاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تقسم أو توازن أبطأ عائلات اختبارات Node حتى تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتعمل مسارات الوحدة السريعة/الدعم الأساسية بشكل منفصل، وتنقسم بنية وقت تشغيل النواة بين أجزاء الحالة والعمليات/الإعدادات، ويعمل الرد التلقائي كعاملين متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner، وdispatch، وcommands/state-routing)، كما تقسم إعدادات Gateway/الخادم الوكيل عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلًا من انتظار مخرجات البناء. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، وPlugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من مجمّع Plugin المشترك. تسجل الأجزاء ذات أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل من جزء مرشح. يبقي `check-additional` عمل ترجمة/Canary لحدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُوزع قائمة حارس الحدود عبر أربعة أجزاء مصفوفة، يشغّل كل منها حراسًا مستقلين محددين بالتوازي ويطبع توقيتات لكل فحص، بما في ذلك `pnpm prompt:snapshots:check` بحيث يثبّت انجراف مطالبات المسار السعيد لوقت تشغيل Codex على طلب السحب الذي سببه. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود الدعم الأساسي بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تحتوي نكهة الطرف الثالث على مجموعة مصدر أو بيان منفصل؛ لا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig لسجل SMS/المكالمات، مع تجنب مهمة تغليف debug APK مكررة عند كل دفع ذي صلة بـ Android.

يشغل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip للإنتاج الخاص بالتبعيات فقط، مثبت على أحدث إصدار من Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip للملفات الإنتاجية غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم ولم تتم مراجعته أو يترك إدخالًا قديمًا في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات المباشرة، وجسور الحزم التي لا يستطيع Knip حلها ثابتًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يقوم بسحب أو تنفيذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المسائل وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المسائل؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، والذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام هو ملاحظة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو خطرًا، أو مفيدًا تشغيليًا. ينبغي أن تؤدي عمليات الفتح الروتينية، والتحرير، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub، والتعليقات، والنصوص، ونصوص المراجعات، وأسماء الفروع، ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## الإرسالات اليدوية

تشغّل عمليات إرسال CI اليدوية مخطط المهام نفسه مثل CI العادي، لكنها تفرض تفعيل كل مسار محدود النطاق غير Android: تقسيمات Linux Node، وتقسيمات Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء السريع، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وتدويل واجهة التحكم. تشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android عبر تمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وتقسيم `agentic-plugins` الخاص بالإصدار فقط، والمسح الدفعي الكامل للإضافات، ومسارات Docker لما قبل إصدار Plugin. تعمل مجموعة Docker لما قبل الإصدار فقط عندما ترسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة بحيث لا تُلغى المجموعة الكاملة لمرشح إصدار بسبب تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط مقابل فرع أو وسم أو SHA كامل لالتزام مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمّنات السريعة، وفحوصات عقود القنوات المقسّمة، وتقسيمات `check` باستثناء lint، وتقسيمات وتجميعات `check-additional`، ومتحققات تجميع اختبارات Node، وفحوصات التوثيق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم تمهيد install-smoke بيئة Ubuntu المستضافة على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وتقسيمات الإضافات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وتقسيمات اختبارات Linux Node، وتقسيمات اختبارات Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساسة للمعالج بما يكفي لجعل 8 vCPU تكلّف أكثر مما وفّرته)؛ وبناءات Docker الخاصة بـ install-smoke (كان وقت انتظار صف 32-vCPU يكلّف أكثر مما وفّره)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود الفروع المشتقة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود الفروع المشتقة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس الإرسال اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث بحسب المرجع المختبر، ويسجّل كل `index.md` مرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف الشخصي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل أداء CPU/heap/trace لنقاط السخونة في بدء التشغيل، وGateway، ودورة agent.
- `live-gpt54`: دورة agent حقيقية من OpenAI `openai/gpt-5.4`، وتُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا تحقيقات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات ترحيب `channel-chat-baseline` متكررة باستخدام mock-OpenAI؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لتحقيق المصدر في `source/index.md` ضمن حزمة التقرير، وبجانبه JSON الخام.

يرفع كل مسار قطع GitHub الأثرية. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يلتزم سير العمل أيضًا بـ `report.json`، و`report.md`، والحزم، و`index.md`، وقطع تحقيق المصدر الأثرية إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلي لعبارة "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا لالتزام، ويرسل سير عمل `CI` اليدوي بذلك الهدف، ويرسل `Plugin Prerelease` لإثباتات Plugin/الحزمة/الفحوصات الثابتة/Docker الخاصة بالإصدار فقط، ويرسل `OpenClaw Release Checks` لاختبار التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تبقي التشغيلات المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية الاختبار المطوّل تلك حتى يبقى تحقق التنبيهات الواسع واسعًا. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` مقابل قطعة `release-package-under-test` الأثرية من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروقات الملفات الشخصية، والقطع الأثرية، و
مقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي المغيّر. أرسله
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

يجب أن تكون مراجع إرسال سير عمل GitHub فروعًا أو وسومًا، وليست SHAs خامًا للالتزامات. يدفع
المساعد فرعًا مؤقتًا باسم `release-ci/<sha>-...` عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عندما
تكتمل التشغيل. كما يفشل متحقق المظلة إذا عمل أي سير عمل فرعي عند
SHA مختلف.

`release_profile` يتحكم في اتساع المزوّد/الاختبارات المباشرة الذي يُمرَّر إلى فحوصات الإصدار. تكون
سير عمل الإصدار اليدوية افتراضياً على `stable`؛ استخدم `full` فقط عندما
تريد عمداً مصفوفة مزوّدي/وسائط الاستشارة الواسعة. يتحكم `run_release_soak`
في ما إذا كانت فحوصات الإصدار المستقرة/الافتراضية تشغّل اختبارات التحمل الشاملة للمباشر/E2E ومسار إصدار
Docker؛ يفرض `full` تشغيل اختبار التحمل.

- يبقي `minimum` أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّد/الخلفية المستقرة.
- يشغّل `full` مصفوفة مزوّدي/وسائط الاستشارة الواسعة.

يسجّل الشامل معرّفات تشغيل الأبناء المُرسلة، وتعيد مهمة `Verify full validation` النهائية التحقق من نتائج تشغيل الأبناء الحالية وتُلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وأصبح أخضر، فأعد تشغيل مهمة متحقق الأصل فقط لتحديث نتيجة الشامل وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`plugin-prerelease` لابن الإصدار التمهيدي للـ Plugin فقط، و`release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الشامل. يبقي هذا إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركّز. لمسار cross-OS واحد فاشل، ادمج `rerun_group=cross-os` مع `cross_os_suite_filter`، مثل `windows/packaged-upgrade`؛ تُصدر أوامر cross-OS الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات QA release-check استشارية، لذلك تحذّر إخفاقات QA فقط لكنها لا تحظر متحقق release-check.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى حزمة tarball باسم `release-package-under-test`، ثم تمرر ذلك الأثر إلى فحوصات cross-OS وPackage Acceptance، بالإضافة إلى سير عمل Docker لمسار إصدار المباشر/E2E عندما تعمل تغطية التحمل. يبقي ذلك بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام أبناء.

تتجاوز تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
الشامل الأقدم. يلغي مراقب الأصل أي سير عمل ابن سبق أن أرسله
عند إلغاء الأصل، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل release-check قديم مدته ساعتان. تُبقي عمليات التحقق من فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة `cancel-in-progress: false`.

## شظايا المباشر وE2E

يبقي ابن المباشر/E2E للإصدار تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغّلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلاً من مهمة تسلسلية واحدة:

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
- شظايا صوت/فيديو وسائط مقسمة وشظايا موسيقى مفلترة حسب المزوّد

يبقي ذلك تغطية الملفات نفسها مع جعل إخفاقات مزوّد المباشر البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الشظايا التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية ذات اللقطة الواحدة.

تعمل شظايا وسائط المباشر الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبّت تلك الصورة مسبقاً `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ مجموعات المباشر المدعومة بـ Docker على مشغّلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لإطلاق اختبارات Docker المتداخلة.

تستخدم شظايا نموذج/خلفية المباشر المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل إصدار المباشر تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker المباشر وGateway المقسّمة حسب المزوّد وخلفية CLI وربط ACP وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شظايا Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل حتى يفشل مسار الحاوية العالق أو التنظيف بسرعة بدلاً من استهلاك ميزانية release-check كاملة. إذا أعادت تلك الشظايا بناء هدف Docker الكامل من المصدر بشكل مستقل، فتشغيل الإصدار مضبوط بشكل خاطئ وسيهدر وقت الساعة على بناء صور مكرر.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو مختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. تفحص `resolve_package` القيمة `workflow_ref`، وتحل مرشح حزمة واحداً، وتكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، وتكتب `.artifacts/docker-e2e-package/package-candidate.json`، وترفع كليهما كأثر `package-under-test`، وتطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف التعريفي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. يحمّل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويحضّر صور Docker ذات بصمة الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلاً من حزم نسخة سير العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضّر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزّع تلك المسارات كمهام Docker مستهدفة متوازية ذات آثار فريدة.
3. تستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. تعمل عندما لا يكون `telegram_mode` هو `none` وتثبّت أثر `package-under-test` نفسه عندما يحل Package Acceptance واحداً؛ ويمكن لإرسال Telegram المستقل أن يظل يثبّت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدار التمهيدي/المستقر المنشور.
- يحزم `source=ref` فرع `package_ref` أو وسماً أو SHA التزاماً كاملاً موثوقاً. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبّت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- يحمّل `source=url` ملف HTTPS `.tgz`؛ وتكون `package_sha256` مطلوبة.
- يحمّل `source=artifact` ملف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي تقديمها للآثار المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`، و`cron-mcp-cleanup`، و`openai-web-search-minimal`، و`openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin غير متصلة حتى لا يكون تحقق الحزمة المنشورة مرهوناً بتوفر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

للسياسة المخصصة لاختبار التحديث وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يبقي هذا إثبات ترحيل الحزمة، والتحديث، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المضبوط، وPlugin غير المتصل، وplugin-update، وTelegram على tarball الحزمة المحلولة نفسها. عيّن `package_acceptance_package_spec` على Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلاً من الأثر المبني من SHA. لا تزال فحوصات إصدار cross-OS تغطي الإعداد الأولي، والمثبّت، وسلوك المنصة الخاص بكل نظام تشغيل؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بـ Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاظر. في Package Acceptance، يكون tarball `package-under-test` المحلول هو المرشح دائماً، وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسارات الفاشلة على ذلك الخط الأساسي. تضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيم `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة بالإضافة إلى إصدارات حدود توافق Plugin المثبتة وتجهيزات على هيئة مشكلات لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المضبوطة، ومسارات السجلات بالتلدة، وجذور اعتماديات Plugin القديمة الراكدة. تُقسّم اختيارات published-upgrade survivor متعددة خطوط الأساس حسب خط الأساس إلى مهام مشغّل Docker مستهدفة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديثات المنشورة الشامل، لا اتساع Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يضبط المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مخبوزة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows المعبأة والمثبّت الجديد أيضاً من أن حزمة مثبّتة يمكنها استيراد تجاوز للتحكم بالمتصفح من مسار Windows مطلق خام. يكون اختبار دخان agent-turn عبر OpenAI cross-OS افتراضياً على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا على `openai/gpt-5.4`، لذلك يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x.

### نوافذ التوافق القديم

لدى Package Acceptance نوافذ توافق قديم محدودة للحزم المنشورة مسبقاً. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` عناصر `pnpm.patchedDependencies` المفقودة من تجهيز git المزيّف المشتق من tarball وقد يسجل `update.channel` محفوظاً مفقوداً؛
- قد تقرأ اختبارات دخان Plugin مواقع سجل تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التكوين مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات طابع بيانات تعريف البناء المحلي التي كانت قد شحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح فشل تشغيل قبول الحزمة، ابدأ بملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثاره الخاصة بـ Docker: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضل إعادة تشغيل ملف قبول الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار التثبيت السريع

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. ويقسم تغطية الاختبار السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمرنها مهام اختبار Docker السريع. لا تحجز تغييرات Plugin المضمن المقتصرة على المصدر، والتعديلات المقتصرة على الاختبارات، والتعديلات المقتصرة على الوثائق عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغل اختبار CLI السريع لحذف الوكلاء لمساحة العمل المشتركة، ويشغل اختبار e2e لشبكة Gateway في الحاوية، ويتحقق من وسيط بناء إضافة مضمنة، ويشغل ملف Docker المحدود للـ Plugin المضمن ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع حد منفصل لكل تشغيل Docker في كل سيناريو).
- **المسار الكامل** يبقي تثبيت حزمة QR وتغطية Docker/تحديث المثبت للتشغيلات الليلية المجدولة، وعمليات الإطلاق اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلا أسطح المثبت/الحزمة/Docker. في الوضع الكامل، يحضر install-smoke أو يعيد استخدام صورة اختبار سريع Dockerfile جذرية من GHCR مرتبطة بـ SHA الهدف، ثم يشغل تثبيت حزمة QR، واختبارات Dockerfile/Gateway الجذرية السريعة، واختبارات المثبت/التحديث السريعة، وDocker E2E السريع للـ Plugin المضمن كمهام منفصلة حتى لا ينتظر عمل المثبت خلف اختبارات الصورة الجذرية السريعة.

دفعات `main` (بما في ذلك commits الدمج) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يبقي سير العمل اختبار Docker السريع ويترك اختبار التثبيت الكامل السريع للتشغيل الليلي أو تحقق الإصدار.

اختبار تثبيت Bun العام البطيء لموفر الصور محكوم بشكل منفصل بواسطة `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات الإطلاق اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار مباشر مشتركة واحدة مسبقا، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git عار لمسارات المثبت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبت الأرشيف نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويوجد منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات التجمع الرئيسي للمسارات العادية.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات تجمع الذيل الحساس للموفر.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات المباشرة المتزامنة حتى لا تخنق الموفرات.                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | حد مسارات تثبيت npm المتزامنة.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد مسارات الخدمات المتعددة المتزامنة.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | التباعد بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم التباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات مباشرة/ذيلية محددة حدودا أضيق.             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معين  | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معين  | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى تنظيف الاختبار السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعال أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تقوم فحوصات التجميع المحلية المسبقة بفحص Docker، وإزالة حاويات OpenClaw E2E القديمة، وإصدار حالة المسارات النشطة، وحفظ توقيتات المسارات للترتيب من الأطول إلى الأقصر، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد الفشل الأول.

### سير عمل مباشر/E2E قابل لإعادة الاستخدام

يسأل سير العمل المباشر/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة المباشرة والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. وهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل أثر حزمة من التشغيل الحالي، أو ينزل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من قائمة محتويات الأرشيف؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية من GHCR الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو الصور الموجودة ذات ملخص الحزمة بدلا من إعادة البناء. تعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة، بحيث يعاد بسرعة تشغيل تدفق سجل/ذاكرة مؤقتة عالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ مسارات متعددة عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` ومن `plugins-runtime-install-a` إلى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. ويبقى الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي اليدوي لإعادة التشغيل لكلا مساري مثبت الموفر.

يدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات الإطلاق الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمنة المحاولة مرة واحدة عند حالات فشل شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات والتوقيتات و`summary.json` و`failures.json` وتوقيتات المراحل وJSON خطة المجدول وجداول المسارات البطيئة وأوامر إعادة التشغيل لكل مسار. يشغل مدخل `docker_lanes` في سير العمل المسارات المحددة على الصور المحضرة بدلا من مهام الأجزاء، مما يحصر تصحيح المسار الفاشل في مهمة Docker موجهة واحدة ويحضر أو ينزل أو يعيد استخدام أثر الحزمة لذلك التشغيل؛ وإذا كان مسار محدد مسارا مباشرا في Docker، تبني المهمة الموجهة صورة الاختبار المباشر محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل لكل مسار المولدة في GitHub `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضرة عند وجود تلك القيم، حتى يتمكن مسار فاشل من إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير العمل المباشر/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## الإصدار المسبق لـ Plugin

`Plugin Prerelease` تغطية منتج/حزمة أكثر تكلفة، لذا فهو سير عمل منفصل يطلقه `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات إطلاق CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمنة عبر ثمانية عمال امتدادات؛ وتشغل مهام شظايا الامتدادات هذه ما يصل إلى مجموعتين من إعدادات Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات Plugin الثقيلة بالاستيراد مهام CI إضافية. يجمع مسار Docker المسبق للإصدار والمقتصر على الإصدار مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها من دقيقة إلى ثلاث دقائق.

## مختبر QA

لدى مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل ضمن مجموعات QA والإصدار الواسعة، وليس سير عمل مستقلا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسع.

- يشغل سير عمل `QA-Lab - All Lanes` ليليا على `main` وعند الإطلاق اليدوي؛ ويفرع مسار تكافؤ المحاكاة ومسار Matrix المباشر ومسارات Telegram وDiscord المباشرة كمهام متوازية. تستخدم المهام المباشرة بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغل فحوصات الإصدار مساري نقل Matrix وTelegram المباشرين مع موفر المحاكاة الحتمي والنماذج المؤهلة للمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يعزل عقد القناة عن زمن استجابة النموذج المباشر وبدء تشغيل Plugin الموفر العادي. يعطل Gateway النقل المباشر بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال الموفر مجموعات النموذج المباشر والموفر الأصلي وموفر Docker المنفصلة.

يستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI المسحوب ذلك. يبقى افتراضي CLI ومدخل سير العمل اليدوي `all`؛ وتقسم عملية الإطلاق اليدوية `matrix_profile=all` دائما تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغل `OpenClaw Release Checks` أيضا مسارات مختبر QA الحرجة للإصدار قبل موافقة الإصدار؛ وتشغل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزل كلا الأثرين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى طلبات PR العادية، اتبع أدلة CI/الفحص المحددة النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو ماسح أمان أولي ضيق النطاق عن قصد، وليس فحصا شاملا للمستودع الكامل. تعمل عمليات الحماية اليومية واليدوية والخاصة بطلبات السحب غير المسودة على فحص كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمان عالية الثقة، ومفلترة إلى `security-severity` عالية/حرجة.

يبقى حارس طلب السحب خفيفا: فهو لا يبدأ إلا للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغل مصفوفة الأمان عالية الثقة نفسها التي يشغلها سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات PR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وصندوق العزل، وCron، وخط الأساس لـ Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                  |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدو تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                        |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android المجدول. يبني تطبيق Android يدويا من أجل CodeQL على أصغر مشغل Blacksmith Linux تقبله سلامة سير العمل. يرفع النتائج ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS الأسبوعي/اليدوي. يبني تطبيق macOS يدويا من أجل CodeQL على Blacksmith macOS، ويفلتر نتائج بناء التبعيات من SARIF المرفوع، ويرفع النتائج ضمن `/codeql-critical-security/macos`. يبقى خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو جزء الجودة غير الأمني المقابل. يشغل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية وبمستوى خطأ على أسطح ضيقة عالية القيمة، على مشغل Blacksmith Linux الأصغر. حارس طلب السحب الخاص به أصغر عمدا من ملف التعريف المجدول: طلبات PR غير المسودة تشغل فقط الأجزاء المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوجيه الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/غراء SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تشغل تغييرات إعدادات CodeQL وسير عمل الجودة كل أجزاء جودة PR الاثني عشر.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                  | السطح                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود الأمان للمصادقة، والأسرار، وصندوق العزل، وCron، وGateway                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال والإخراج                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت التشغيل لتنفيذ الأوامر، وتوجيه النموذج/المزوّد، وتوجيه الرد التلقائي وطوابيره، ومستوى تحكم ACP                                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدو الإشراف على العمليات، وعقود التسليم الصادر                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، وواجهات وقت تشغيل الذاكرة، وأسماء الذاكرة المستعارة في Plugin SDK، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدو ربط/تسليم الجلسات الصادرة، وأسطح حزمة الأحداث/السجلات التشخيصية، وعقود CLI لطبيب الجلسات                 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدو حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدو ربط الجلسة/الخيط                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضيات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                       |
| `/codeql-critical-quality/ui-control-plane`             | إقلاع واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت التشغيل لجلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                      |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدو عقد حزمة Plugin                                                                                                    |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمنة كعمل لاحق محدد النطاق أو مجزأ فقط بعد أن تصبح ملفات التعريف الضيقة مستقرة في زمن التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الموجودة متوافقة مع التغييرات التي هبطت حديثا. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح لدفع غير بوت على `main` أن يفعله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أنشئ في الساعة الأخيرة. عند تشغيله، يراجع نطاق الالتزامات من SHA مصدر `Docs Agent` السابق غير المتخطى إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر تمرير للمستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح لدفع غير بوت على `main` أن يفعله، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد عمل أو ما زال يعمل في ذلك اليوم بحسب UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع من جديد؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يستطيع إجراء Codex الحفاظ على وضعية أمان إسقاط sudo نفسها التي يستخدمها وكيل المستندات.

### طلبات PR المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يضبط افتراضيا على التشغيل الجاف، ولا يغلق إلا طلبات PR المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب PR الهابط قد دُمج وأن كل تكرار لديه إما مشكلة مرجعية مشتركة أو أجزاء تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وينفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغل فحص أنواع إنتاج النواة واختبارات النواة إضافة إلى lint/الحراس الخاصة بالنواة؛
- تغييرات اختبارات النواة فقط تشغل فحص أنواع اختبارات النواة فقط إضافة إلى lint النواة؛
- تغييرات إنتاج Plugin تشغل فحص أنواع إنتاج Plugin واختبارات Plugin إضافة إلى lint Plugin؛
- تغييرات اختبارات Plugin فقط تشغل فحص أنواع اختبارات Plugin إضافة إلى lint Plugin؛
- تغييرات Plugin SDK العام أو عقد Plugin تتوسع إلى فحص أنواع Plugin لأن Plugins تعتمد على عقود النواة تلك (وتبقى فحوصات Vitest الخاصة بـ Plugin عملا اختباريا صريحا)؛
- زيادات الإصدار الخاصة ببيانات تعريف الإصدار فقط تشغل فحوصات مستهدفة للإصدار/الإعدادات/تبعيات الجذر؛
- تفشل تغييرات الجذر/الإعدادات غير المعروفة بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغل نفسها، وتفضل تعديلات المصدر تعيينات صريحة، ثم اختبارات الأشقاء والمعتمدين في رسم بياني الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد التعيينات الصريحة: تمر تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجه نظام أداة الرسائل عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير على مستوى عدة الاختبار بما يكفي لأن المجموعة الرخيصة المعيّنة ليست وكيلا موثوقا.

## التحقق باستخدام Testbox

شغّل Testbox من جذر المستودع، وفضّل صندوقًا مهيأ حديثًا لإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على غير المتوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة سريعًا عندما تختفي ملفات جذر مطلوبة مثل `pnpm-lock.yaml` أو عندما يُظهر `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وهيّئ صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs التي تتضمن حذفًا كبيرًا مقصودًا، اضبط `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محلي يبقى في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو مغلّف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص واسعًا أكثر من اللازم لحلقة تحرير محلية، أو عندما يهم التكافؤ مع CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات حزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. واجهة OpenClaw الخلفية العادية هي `blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة بديلًا احتياطيًا عند انقطاعات Blacksmith، أو مشكلات الحصة، أو اختبارات السعة المملوكة الصريحة.

قبل التشغيل الأول، افحص المغلّف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض مغلّف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً رغم أن `.crabbox.yaml` يحتوي على إعدادات افتراضية للسحابة المملوكة.

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider`، و`leaseId`، و`syncDelegated`، و`exitCode`، و`commandMs`، و`totalMs`. ينبغي لتشغيلات Crabbox المدعومة من Blacksmith لمرة واحدة أن توقف Testbox تلقائيًا؛ إذا انقطع تشغيل أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق المهيأ نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت الطبقة المعطلة هي Crabbox لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرة كبديل ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

يمتلك `.crabbox.yaml` إعدادات المزوّد، والمزامنة، والتهيئة الافتراضية لـ GitHub Actions لمسارات السحابة المملوكة. يستثني `.git` المحلي لكي يحتفظ سحب Actions المهيأ ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرف، ويستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يمتلك `.github/workflows/crabbox-hydrate.yml` السحب، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

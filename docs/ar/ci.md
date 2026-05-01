---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدارات، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-05-01T07:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

يشغّل OpenClaw CI عند كل دفع إلى `main` وعند كل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات تشغيل `workflow_dispatch` اليدوية عمدا تحديد النطاق الذكي وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تقع تغطية Plugin الخاصة بالإصدار فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease) ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                              | الغرض                                                                                      | متى تعمل                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI      | دائما عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                        | دائما عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج من دون تبعيات مقابل تحذيرات npm                             | دائما عند عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                | دائما عند عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip للإنتاج الخاصة بالتبعيات فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                    | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وControl UI، وفحوصات القطع المبنية، والقطع القابلة لإعادة الاستخدام للاستهلاك اللاحق          | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات الحزم المضمّنة وعقد Plugin والبروتوكول                 | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقد القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                         | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والحزم المضمّنة والعقود والإضافات             | تغييرات ذات صلة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج، واللنت، والحراس، وأنواع الاختبارات، واختبار دخان صارم   | تغييرات ذات صلة بـ Node              |
| `check-additional`               | أجزاء البنية، والحدود، وحراس سطح الإضافات، وحدود الحزم، ومراقبة Gateway | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات دخان CLI المبنية واختبار دخان ذاكرة بدء التشغيل                                               | تغييرات ذات صلة بـ Node              |
| `checks`                         | متحقق لاختبارات قنوات القطع المبنية                                                    | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء ودخان توافق Node 22                                                   | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق التوثيق، واللنت، وفحوصات الروابط المكسورة                                                | تغيّر التوثيق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                       | تغييرات ذات صلة بـ Skills في Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة         | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام القطع المبنية المشتركة                                  | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | لنت Swift، والبناء، والاختبارات لتطبيق macOS                                               | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلا النكهتين إضافة إلى بناء APK تصحيح واحد                                 | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                    | نجاح CI على main أو تشغيل يدوي |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهاما مستقلة.
2. تفشل `security-scm-fast`، و`security-dependency-audit`، و`security-fast`، و`check`، و`check-additional`، و`check-docs`، و`skills-python` بسرعة من دون انتظار مهام القطع ومصفوفة المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة بحيث يمكن للمستهلكين اللاحقين البدء فور جاهزية البناء المشترك.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core`، و`checks-fast-contracts-channels`، و`checks-node-core-test`، و`checks`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزتها عملية أحدث عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كتشويش CI ما لم تكن أحدث عملية تشغيل للمرجع نفسه تفشل أيضا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` بحيث تظل تبلغ عن إخفاقات الأجزاء العادية لكنها لا تصطف بعد أن يكون سير العمل كله قد تم تجاوزه بالفعل. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) بحيث لا يمكن لعملية عالقة من جهة GitHub في مجموعة طابور قديمة أن تحجب عمليات main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي العمليات قيد التنفيذ.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى لنت سير العمل، لكنها لا تفرض وحدها عمليات بناء Windows أو Android أو macOS الأصلية؛ تبقى مسارات هذه المنصات محددة النطاق لتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات اختبارات أساسية رخيصة مختارة، وتعديلات ضيقة على مساعدي/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريع خاصا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار قطع البناء، وتوافق Node 22، وعقود القنوات، وأجزاء الأساس الكاملة، وأجزاء Plugin المضمّنة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدين التي تختبرها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق لأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي تشغيل npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير المرتبطة وPlugin ودخان التثبيت والاختبارات فقط على مسارات Linux Node.

أبطأ عائلات اختبارات Node مقسمة أو موزونة بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتُقرن مسارات وحدات الأساس الصغيرة، ويعمل الرد التلقائي كأربعة عمال موزونين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner، وdispatch، وcommands/state-routing)، وتوزع إعدادات Gateway/Plugin الوكيلية عبر مهام Node الوكيلية الحالية الخاصة بالمصدر فقط بدلا من انتظار القطع المبنية. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، وPlugin المتنوعة إعدادات Vitest المخصصة لها بدلا من لاقط Plugin المشترك. تسجل أجزاء أنماط التضمين مدخلات التوقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مرشح. يبقي `check-additional` عمل تجميع/كناري حدود الحزم معا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ يشغّل جزء حارس الحدود حراسه الصغيرة المستقلة بالتزامن داخل مهمة واحدة. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم الأساس بالتزامن داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تحتوي نكهة الطرف الثالث على مجموعة مصدر أو بيان منفصل؛ لا يزال مسار اختبار الوحدة الخاص بها يجمّع النكهة مع أعلام BuildConfig الخاصة برسائل SMS وسجل المكالمات، مع تجنب مهمة تغليف APK تصحيح مكررة عند كل دفع ذي صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip للإنتاج خاصة بالتبعيات فقط ومثبتة على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر الإصدار في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفا جديدا غير مستخدم وغير مراجع أو يترك مدخلا قديما في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ثابتا.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام كما في CI العادي لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، ودخان البناء، وفحوصات التوثيق، وSkills في Python، وWindows، وmacOS، وتدويل Control UI. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ تفعّل مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستبعد فحوصات Plugin Prerelease الثابتة، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومسح دفعات الإضافات الكامل، ومسارات Docker الخاصة بـ Plugin Prerelease من CI. لا تعمل مجموعة Docker prerelease إلا عندما يطلق `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة تحقق الإصدار.

تستخدم العمليات اليدوية مجموعة تزامن فريدة بحيث لا تُلغى مجموعة مرشح إصدار كاملة بسبب دفع آخر أو عملية طلب سحب على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدع موثوق تشغيل ذلك الرسم البياني على فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/الحزم السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء وتجميعات `check-additional`، ومتحققات تجميع اختبارات Node، وفحوصات المستندات، وSkills الخاصة بـ Python، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم تمهيد install-smoke نظام Ubuntu المستضاف على GitHub كي تتمكن مصفوفة Blacksmith من الاصطفاف أبكر |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء Plugin الأخف وزناً، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Node على Linux، وأجزاء اختبارات Plugin المضمنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس للمعالج بما يكفي لأن 8 vCPU كانت تكلف أكثر مما وفرت)؛ وبُنى Docker الخاصة بـ install-smoke (كان زمن انتظار طابور 32-vCPU يكلف أكثر مما يوفر)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود التفرعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود التفرعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

## تحقق الإصدار الكامل

`Full Release Validation` هو سير العمل اليدوي الجامع لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعاً أو وسماً أو SHA كاملاً للالتزام، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثباتات Plugin/الحزمة/الثابت/Docker الخاصة بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لفحص التثبيت، وقبول الحزمة، ومجموعات مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. ويمكنه أيضاً تشغيل سير عمل `NPM Telegram Beta E2E` اللاحق للنشر عند توفير مواصفة حزمة منشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، واختلافات الملفات التعريفية، والآثار، ومقابض
إعادة التشغيل المركزة.

يتحكم `release_profile` في اتساع الاختبارات الحية/المزوّدين الممرر إلى فحوصات الإصدار. تضبط
مسارات عمل الإصدار اليدوية القيمة الافتراضية على `stable`؛ استخدم `full` فقط عندما
تريد عمداً مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّدين/الخلفيات المستقرة.
- يشغّل `full` مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

يسجل السير الجامع معرّفات تشغيل الأبناء الذين تم تشغيلهم، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وأصبح أخضر، فأعد تشغيل مهمة التحقق الأب فقط لتحديث نتيجة السير الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`plugin-prerelease` لابن ما قبل إصدار Plugin فقط، و`release-checks` لكل ابن إصدار، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على السير الجامع. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker لمسار الإصدار الحي/E2E وجزء قبول الحزمة. هذا يحافظ على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في مهام أبناء متعددة.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تتجاوز السير الجامع الأقدم. يلغي مراقب الأصل أي سير عمل ابن كان قد شغّله بالفعل
عند إلغاء الأصل، لذلك لا يبقى تحقق main الأحدث خلف تشغيل release-check قديم مدته ساعتان.
تحافظ عمليات تحقق فروع/وسوم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## الأجزاء الحية وE2E

يحافظ ابن الإصدار الحي/E2E على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغّلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلاً من مهمة تسلسلية واحدة:

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

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات المزوّدين الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الأجزاء التجميعية `native-live-extensions-o-z`، و`native-live-extensions-media`، و`native-live-extensions-media-music` صالحة لإعادة التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبني بواسطة سير عمل `Live Media Runner Image`. تثبّت هذه الصورة مسبقاً `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ المجموعات الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء النماذج/الخلفيات الحية المدعومة بـ Docker صورة مشتركة منفصلة باسم `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المجزأ حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل، بحيث يفشل المسار العالق في الحاوية أو التنظيف بسرعة بدلاً من استهلاك ميزانية release-check كاملة. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فإن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقتاً فعلياً على بُنى صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو يختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يتحقق `resolve_package` من `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` ملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون ملف tarball، ويجهز صور Docker الخاصة بملخصات الحزم عند الحاجة، ويشغل مسارات Docker المحددة على تلك الحزمة بدلا من حزم نسخة سير العمل المسحوبة. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none`، ويثبت أثر `package-under-test` نفسه عندما تكون Package Acceptance قد حلته؛ ولا يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدارا دقيقا من OpenClaw مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعا أو وسما أو SHA التزاما كاملا موثوقا في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من سجل فرع المستودع أو وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عبر HTTPS؛ ويكون `package_sha256` مطلوبا.
- ينزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ يكون `package_sha256` اختياريا لكن يجب توفيره للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو رمز سير العمل/عدة الاختبار الموثوق الذي يشغل الاختبار. `package_ref` هو التزام المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح هذا لعدة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم من دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية Plugin بلا اتصال بحيث لا يعتمد التحقق من الحزمة المنشورة على توافر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

تستدعي فحوصات الإصدار Package Acceptance مع `source=ref` و`package_ref=<release-ref>` و`workflow_ref=<release workflow ref>` و`suite_profile=custom` و`docker_lanes='bundled-channel-deps-compat plugins-offline'` و`telegram_mode=mock-openai`. تغطي أجزاء Docker لمسار الإصدار مسارات الحزمة/التحديث/Plugin المتداخلة؛ وتحافظ Package Acceptance على إثبات توافق القناة المضمنة الأصلي للأثر، وPlugin بلا اتصال، وTelegram، مقابل ملف tarball للحزمة المحلولة نفسه. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي سلوك الإلحاق والتثبيت والمنصة الخاص بكل نظام تشغيل؛ ويجب أن يبدأ تحقق الحزمة/التحديث للمنتج من Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من أساس حزمة منشورة واحد لكل تشغيل. في Package Acceptance، يكون ملف tarball المحلول `package-under-test` هو المرشح دائما، ويحدد `published_upgrade_survivor_baseline` الأساس المنشور، مع القيمة الافتراضية `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الأساس. يمكن للتشغيلات المحلية تعيين `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` إلى حزمة دقيقة مثل `openclaw@2026.4.15`. يهيئ المسار المنشور الأساس بوصفة أمر `openclaw config set` مدمجة، ثم يسجل خطوات الوصفة في `summary.json`. يجب تجزئة تغطية الإصدارات السابقة الأوسع عبر Package Acceptance على قيم `published_upgrade_survivor_baseline` دقيقة. تتحقق مسارات Windows للحزمة والمثبت الجديدة أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز تحكم في المتصفح من مسار Windows مطلق خام. يعتمد اختبار دخان دورة وكيل OpenAI عبر أنظمة التشغيل افتراضيا على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينه، وإلا يستخدم `openai/gpt-5.4-mini`، كي يبقى إثبات التثبيت وGateway سريعا وحتميا.

### نوافذ التوافق القديمة

تملك Package Acceptance نوافذ محدودة للتوافق القديم للحزم المنشورة مسبقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات ضمان الجودة الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` حالة فرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من أداة git الزائفة المشتقة من ملف tarball وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات دخان Plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات التعريف للإعدادات مع الاستمرار في طلب بقاء سجل التثبيت وسلوك عدم إعادة التثبيت من دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات وسم بيانات تعريف البناء المحلي التي كانت قد شحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` للتأكد من مصدر الحزمة، والإصدار، وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام دخان Docker. لا تحجز تغييرات Plugin المضمنة الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات التوثيق فقط، عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغل اختبار e2e للحاوية `gateway-network`، ويتحقق من وسيطة بناء Plugin مضمن، ويشغل ملف تعريف Docker المحدود لـ Plugin المضمن ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- يحافظ **المسار الكامل** على تثبيت حزمة QR وتغطية Docker/التحديث للمثبت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر استدعاء سير العمل، وطلبات السحب التي تلمس بالفعل أسطح المثبت/الحزم/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة دخان GHCR واحدة لـ Dockerfile الجذري خاصة بـ target-SHA، ثم يشغل تثبيت حزمة QR، واختبارات دخان Dockerfile/Gateway الجذرية، واختبارات دخان المثبت/التحديث، واختبار Docker E2E السريع لـ Plugin المضمن كمهام منفصلة بحيث لا ينتظر عمل المثبت خلف اختبارات دخان الصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك التزامات الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يحافظ سير العمل على دخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع اختبار دخان مزود الصور للتثبيت العام البطيء عبر Bun بشكل منفصل لـ `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile المركزة على التثبيت الخاصة بها.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقا صورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف tarball لـ npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### المعلمات القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة كي لا يفرض المزودون قيود سرعة.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تدرج زمني بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ عينه إلى `0` لعدم وجود تدرج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات الحي/الذيل المحددة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معين   | يطبع `1` خطة المجدول من دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معين   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى دخان التنظيف كي يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن أن يبدأ مسار أثقل من حده الفعلي من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تجري التجميعة المحلية فحوصات Docker الأولية، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل live/E2E القابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، وصورة live، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات GitHub وملخصات. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل أثر حزمة من التشغيل الحالي، أو ينزل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة من الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلا من إعادة البناء. يعاد تنفيذ عمليات سحب صور Docker مع مهلة محدودة قدرها 180 ثانية لكل محاولة، بحيث يعاد سريعا تيار سجل/ذاكرة تخزين مؤقت عالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker الخاصة بالإصدار عبر مهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط، وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`، و`bundled-channels-core`، و`bundled-channels-update-a`، و`bundled-channels-update-discord`، و`bundled-channels-update-b`، و`bundled-channels-contracts`. يظل جزء `bundled-channels` التجميعي متاحا لإعادات التشغيل اليدوية لمرة واحدة، وتظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار لمسار `install-e2e` هو الاسم المستعار التجميعي اليدوي لإعادة التشغيل لكلا مساري مثبت المزود. يشغل جزء `bundled-channels` مسارات `bundled-channel-*` و`bundled-channel-update-*` المقسمة بدلا من مسار `bundled-channel-deps` التسلسلي الشامل.

يدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وملف JSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل إدخال `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المحضرة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محصورا في مهمة Docker مستهدفة واحدة، ويحضّر أثر الحزمة لذلك التشغيل أو ينزله أو يعيد استخدامه؛ وإذا كان المسار المحدد مسار Docker حي، فتبني المهمة المستهدفة صورة اختبار live محليا لتلك الإعادة. تتضمن أوامر GitHub المولدة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضرة عندما تكون تلك القيم موجودة، بحيث يمكن لمسار فاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو سير عمل منفصل يشغله `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية، وعمليات الدفع إلى `main`، وعمليات إرسال CI اليدوية المستقلة تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال امتدادات؛ وتشغل مهام شظايا الامتدادات هذه ما يصل إلى مجموعتي إعداد Plugin في كل مرة، مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر، حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker للإصدار التمهيدي الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام تستغرق دقيقة إلى ثلاث دقائق.

## مختبر QA

يمتلك مختبر QA مسارات CI مخصصة خارج سير العمل الذكي الرئيسي المحدد النطاق.

- يعمل سير عمل `Parity gate` عند تغييرات PR المطابقة وعند الإرسال اليدوي؛ إذ يبني وقت تشغيل QA الخاص، ويقارن حزم الوكلاء الوهمية GPT-5.5 وOpus 4.6.
- يعمل سير عمل `QA-Lab - All Lanes` ليلا على `main` وعند الإرسال اليدوي؛ ويفرع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين باستخدام المزود الوهمي الحتمي والنماذج المؤهلة وهميا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يعزل عقد القناة عن كمون النموذج الحي وبدء Plugin المزود العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال المزود مجموعات النموذج الحي، والمزود الأصلي، ومزود Docker المنفصلة.

تستخدم Matrix الخيار `--profile fast` لبوابات الجدولة والإصدار، وتضيف `--fail-fast` فقط عندما يدعمها CLI الموجود في الخروج. يظل إدخال سير العمل اليدوي والافتراضي في CLI هو `all`؛ ويفرع إرسال `matrix_profile=all` اليدوي دائما تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغل `OpenClaw Release Checks` أيضا مسارات مختبر QA الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغل بوابة تكافؤ QA الخاصة به حزم المرشح والخط الأساسي كمهام مسار متوازية، ثم تنزل كلا الأثرين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

لا تضع مسار هبوط PR خلف `Parity gate` إلا إذا كان التغيير يمس فعلا وقت تشغيل QA، أو تكافؤ حزم النماذج، أو سطحا يملكه سير عمل التكافؤ. بالنسبة لإصلاحات القنوات أو الإعدادات أو المستندات أو اختبارات الوحدة العادية، تعامل معه كإشارة اختيارية واتبع دليل CI/الفحص المحدد النطاق بدلا من ذلك.

## CodeQL

سير عمل `CodeQL` هو ماسح أمني ضيق للمرحلة الأولى عمدا، وليس فحصا شاملا لكامل المستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرا باستخدام استعلامات أمان عالية الثقة مفلترة إلى `security-severity` عالية/حرجة.

تبقى حراسة طلب السحب خفيفة: تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يظل CodeQL الخاص بـ Android وmacOS خارج افتراضات PR.

### فئات الأمان

| الفئة                                            | السطح                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وصندوق الحماية، وcron، وخط أساس gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية إضافة إلى وقت تشغيل Plugin القناة، وgateway، وPlugin SDK، والأسرار، ونقاط تدقيق اللمس                       |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | تثبيت Plugin، والمحمّل، والبيان، والسجل، وتجهيز تبعيات وقت التشغيل، وتحميل المصدر، وأسطح ثقة عقد حزمة Plugin SDK                       |

### شظايا الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويا من أجل CodeQL على أصغر مشغل Linux من Blacksmith يقبله فحص سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا من أجل CodeQL على Blacksmith macOS، وتفلتر نتائج بناء التبعيات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. تبقى خارج الافتراضات اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المطابقة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبخطورة أخطاء على أسطح ضيقة عالية القيمة على مشغل Linux الأصغر من Blacksmith. حراسة طلب السحب الخاصة بها أصغر عمدا من ملف التعريف المجدول: تشغل طلبات PR غير المسودة فقط شظايا الجودة المطابقة `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/صندوق الحماية/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول/طريقة خادم gateway، ووقت تشغيل الذاكرة/غراء SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزود/فهرس النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو تغييرات وقت تشغيل رد Plugin SDK. تشغل تغييرات إعدادات CodeQL وسير عمل الجودة كل شظايا جودة PR الاثنتي عشرة.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وصندوق الحماية وCron وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات والترحيل والتطبيع وعقود الإدخال/الإخراج                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القنوات المضمّنة                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوجيه النموذج/المزوّد، وتوجيه الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى التحكم في ACP                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | الأجزاء الداخلية لطابور الرد، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئتها/وقت تشغيلها، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/المؤشر                  |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                       |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل الجلب/البحث الأساسي على الويب، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                               |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقاط دخول Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقود حزم Plugins                                                                                               |

تبقى الجودة منفصلة عن الأمان بحيث يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون إخفاء إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugins المضمّنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تستقر الملفات التعريفية الضيقة من حيث وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت حديثا. ليس لديه جدول زمني خالص: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يشغّله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل التنفيذ عندما يكون `main` قد تقدم، أو عندما يكون تشغيل آخر غير متخطى من Docs Agent قد أُنشئ خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، لذلك يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر تمرير على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. ليس لديه جدول زمني خالص: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يشغّله، لكنه يتخطى التنفيذ إذا كان استدعاء آخر لتشغيل سير العمل قد عمل أو لا يزال يعمل في ذلك اليوم وفق UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. ينشئ المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من عمليات إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، فقد يصلح Codex الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ثم يعيد محاولة الدفع؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub بحيث يستطيع إجراء Codex الحفاظ على وضع السلامة نفسه الخاص بإسقاط sudo مثل وكيل المستندات.

### PRs مكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. يكون افتراضيا في وضع التشغيل الجاف ولا يغلق إلا PRs المدرجة صراحة عند `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الذي وصل قد دُمج وأن كل تكرار لديه إما مشكلة مرجعية مشتركة أو أجزاء تغيير متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

توجد منطق مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وينفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغّل فحص أنواع الإنتاج الأساسي وفحص أنواع اختبارات الأساس إضافة إلى فحص lint/guards للأساس؛
- تغييرات اختبارات الأساس فقط تشغّل فقط فحص أنواع اختبارات الأساس إضافة إلى فحص lint للأساس؛
- تغييرات إنتاج الامتدادات تشغّل فحص أنواع إنتاج الامتدادات وفحص أنواع اختبارات الامتدادات إضافة إلى فحص lint للامتدادات؛
- تغييرات اختبارات الامتدادات فقط تشغّل فحص أنواع اختبارات الامتدادات إضافة إلى فحص lint للامتدادات؛
- تغييرات Plugin SDK العامة أو عقود Plugins تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود الأساس هذه (تبقى جولات Vitest للامتدادات عملا اختباريا صريحا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوصا موجهة للإصدار/الإعدادات/اعتماديات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يوجد توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والاعتماديات في مخطط الاستيراد. إعداد تسليم الردود لغرف المجموعات المشتركة هو أحد الخرائط الصريحة: تمر التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم الرد من المصدر، أو موجه النظام لأداة الرسائل عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع لـ PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا بما يكفي على مستوى عدة الاختبار بحيث لا تكون المجموعة الرخيصة المرسومة وكيلا موثوقا.

## تحقق Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقا جديدا محمّى مسبقا للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وحمّ صندوقا جديدا بدلا من تصحيح إخفاق اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذلك.

ينهي `pnpm testbox:run` أيضا استدعاء Blacksmith CLI محليا يبقى في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

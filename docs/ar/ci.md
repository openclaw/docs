---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها.
    - أنت تقوم بتصحيح فحص GitHub Actions فاشل
    - أنت تنسق تشغيل تحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر توجيه ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: خط أنابيب CI
x-i18n:
    generated_at: "2026-06-28T00:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

يعمل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تمر عمليات الدفع الأساسية إلى
`main` أولا عبر نافذة قبول مدتها 90 ثانية على مشغل مستضاف.
تلغي مجموعة التزامن الحالية `CI` ذلك التشغيل المنتظر عند وصول تنفيذ أحدث،
لذلك لا تسجل عمليات الدمج المتتابعة كل منها مصفوفة Blacksmith كاملة.
تتجاوز طلبات السحب وعمليات التشغيل اليدوية الانتظار. ثم تصنف مهمة `preflight`
الفارق وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز عمليات
`workflow_dispatch` اليدوية عمدا تحديد النطاق الذكي وتوسع الرسم البياني الكامل
لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`.
توجد تغطية Plugin الخاصة بالإصدارات فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease)
المنفصل، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation)
أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                              | الغرض                                                                                                   | متى تعمل                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                      | دائما على عمليات الدفع وطلبات السحب غير المسودة      |
| `runner-admission`                 | تهدئة مستضافة لمدة 90 ثانية لعمليات الدفع الأساسية إلى `main` قبل تسجيل عمل Blacksmith                 | كل تشغيل CI؛ السكون فقط على عمليات الدفع الأساسية إلى `main` |
| `security-fast`                    | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق ملف القفل الإنتاجي              | دائما على عمليات الدفع وطلبات السحب غير المسودة      |
| `check-dependencies`               | تمريرة Knip للإنتاج على الاعتماديات فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة            | تغييرات ذات صلة بـ Node                              |
| `build-artifacts`                  | بناء `dist/`، وControl UI، وفحوصات دخان CLI المبني، وفحوصات القطع المبنية المضمنة، وقطع قابلة لإعادة الاستخدام | تغييرات ذات صلة بـ Node                              |
| `checks-fast-core`                 | مسارات صحة Linux السريعة مثل المضمن، والبروتوكول، وQA Smoke CI، وفحوصات توجيه CI                      | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-plugins-*`  | فحصا عقود Plugin مجزآن                                                                               | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-channels-*` | فحصا عقود القنوات مجزآن                                                                               | تغييرات ذات صلة بـ Node                              |
| `checks-node-core-*`               | أجزاء اختبارات Node الأساسية، مع استثناء مسارات القنوات، والمضمن، والعقود، والإضافات                 | تغييرات ذات صلة بـ Node                              |
| `check-*`                          | مكافئ البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، ودخان صارم | تغييرات ذات صلة بـ Node                              |
| `check-additional-*`               | البنية، وانحراف الحدود/المطالبات المجزأ، وحراس الإضافات، وحدود الحزم، وطوبولوجيا وقت التشغيل          | تغييرات ذات صلة بـ Node                              |
| `checks-node-compat-node22`        | مسار بناء وتدخين لتوافق Node 22                                                                       | تشغيل CI يدوي للإصدارات                              |
| `check-docs`                       | تنسيق الوثائق، وفحصها، وفحوصات الروابط المعطوبة                                                       | عند تغير الوثائق                                     |
| `skills-python`                    | Ruff + pytest للـ Skills المدعومة بـ Python                                                           | تغييرات ذات صلة بـ Skills الخاصة بـ Python          |
| `checks-windows`                   | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة    | تغييرات ذات صلة بـ Windows                           |
| `macos-node`                       | مسار اختبار TypeScript على macOS باستخدام القطع المبنية المشتركة                                       | تغييرات ذات صلة بـ macOS                             |
| `macos-swift`                      | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                              | تغييرات ذات صلة بـ macOS                             |
| `ios-build`                        | إنشاء مشروع Xcode إضافة إلى بناء تطبيق iOS على المحاكي                                                | تطبيق iOS، أو عدة التطبيق المشتركة، أو تغييرات Swabble |
| `android`                          | اختبارات وحدة Android لكلا النكهتين إضافة إلى بناء APK تصحيح واحد                                     | تغييرات ذات صلة بـ Android                           |
| `test-performance-agent`           | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                     | نجاح CI الرئيسي أو تشغيل يدوي                        |
| `openclaw-performance`             | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات mock-provider وdeep-profile وGPT 5.5 الحية      | مجدول وتشغيل يدوي                                    |

## ترتيب الفشل السريع

1. ينتظر `runner-admission` فقط عمليات الدفع الأساسية إلى `main`؛ يدفع تنفيذ أحدث إلى إلغاء التشغيل قبل تسجيل Blacksmith.
2. يقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` عبارة عن خطوات داخل هذه المهمة، لا مهام مستقلة.
3. تفشل `security-fast` و`check-*` و`check-additional-*` و`check-docs` و`skills-python` بسرعة دون انتظار مهام القطع ومصفوفة المنصات الأثقل.
4. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد أن يصبح البناء المشترك جاهزا.
5. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-plugins-*` و`checks-fast-contracts-channels-*` و`checks-node-core-*` و`checks-windows` و`macos-node` و`macos-swift` و`ios-build` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، ويبلغ `build-artifacts` عن إخفاقات القنوات المضمنة، وcore-support-boundary، وgateway-watch مباشرة بدلا من صف مهام تحقق صغيرة. مفتاح تزامن CI التلقائي ممرحل (`CI-v7-*`) حتى لا تتمكن حالة عالقة من جهة GitHub في مجموعة صف قديمة من حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

استخدم `pnpm ci:timings` أو `pnpm ci:timings:recent` أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص زمن الجدار، وزمن الصف، وأبطأ المهام، والإخفاقات، وحاجز توسع `pnpm-store-warmup` من GitHub Actions. يرفع CI أيضا ملخص التشغيل نفسه كقطعة `ci-timings-summary`. لتوقيت البناء، تحقق من خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` العبارة `[build-all] phase timings:` ويتضمن `ui:build`؛ كما ترفع المهمة قطعة `startup-memory`.

في عمليات تشغيل طلبات السحب، تشغل مهمة ملخص التوقيت الطرفية المساعد من مراجعة الأساس الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. هذا يبقي الاستعلام المزوّد برمز خارج الكود الخاضع لسيطرة الفرع مع الاستمرار في تلخيص تشغيل CI الحالي لطلب السحب.

## سياق طلب السحب والأدلة

تشغل طلبات السحب من المساهمين الخارجيين بوابة سياق وأدلة لطلب السحب من
`.github/workflows/real-behavior-proof.yml`. يسحب سير العمل تنفيذ الأساس الموثوق
ويقيم متن طلب السحب فقط؛ ولا ينفذ كودا من فرع المساهم.

تنطبق البوابة على مؤلفي طلبات السحب الذين ليسوا مالكي المستودع أو أعضاءه أو
متعاونين فيه أو بوتات. تنجح عندما يحتوي متن طلب السحب على قسمي
`What Problem This Solves` و`Evidence` من تأليف الكاتب. يمكن أن تكون الأدلة اختبارا
مركزا، أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو مخرجات طرفية، أو ملاحظة حية،
أو سجلا منقحا، أو رابط قطعة. يقدم المتن القصد والتحقق المفيد؛ ويفحص المراجعون
الكود والاختبارات وCI لتقييم الصحة.

عندما يفشل الفحص، حدّث متن طلب السحب بدلا من دفع تنفيذ كود آخر.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى فحص سير العمل، لكنها لا تفرض بحد ذاتها بناءات Windows أو iOS أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات محددة النطاق حسب تغييرات مصدر المنصة.
- **سلامة سير العمل** تشغل `actionlint` و`zizmor` على كل ملفات YAML الخاصة بسير العمل، وحارس استيفاء composite-action، وحارس علامات التعارض. كما تشغل مهمة `security-fast` المحددة النطاق لطلب السحب `zizmor` على ملفات سير العمل المتغيرة حتى تفشل نتائج أمان سير العمل مبكرا في رسم CI الرئيسي.
- **الوثائق على عمليات الدفع إلى `main`** يفحصها سير عمل `Docs` المستقل باستخدام مرآة وثائق ClawHub نفسها التي يستخدمها CI، لذلك لا تصف عمليات الدفع المختلطة بين الكود والوثائق جزء `check-docs` من CI أيضا. لا تزال طلبات السحب وCI اليدوي يشغلان `check-docs` من CI عند تغير الوثائق.
- **TUI PTY** يعمل في جزء Linux Node `checks-node-core-runtime-tui-pty` لتغييرات TUI. يشغل الجزء `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك يغطي كلا من مسار fixture الحتمي `TuiBackend` ودخان `tui --local` الأبطأ الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- **تعديلات توجيه CI فقط، وتعديلات fixture مختارة لاختبارات أساسية رخيصة، وتعديلات ضيقة على مساعدين/توجيه اختبارات عقود Plugin** تستخدم مسار بيان سريع لـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار قطع البناء، وتوافق Node 22، وعقود القنوات، وأجزاء core الكاملة، وأجزاء Plugin المضمن، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدين التي تمرنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق إلى مغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغلات npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى التغييرات غير ذات الصلة في المصدر، أو Plugin، أو install-smoke، أو الاختبارات فقط على مسارات Linux Node.

تُقسَّم عائلات اختبارات Node الأبطأ أو تُوازَن بحيث تبقى كل مهمة صغيرة من دون حجز مفرط للمشغّلات: تعمل عقود Plugin وعقود القنوات كلٌّ منها كشريحتين موزونتين مدعومتين من Blacksmith مع الرجوع القياسي إلى مشغّل GitHub، وتعمل مسارات وحدات core السريعة/الداعمة بشكل منفصل، وتُقسَّم بنية تشغيل core التحتية بين الحالة، والعملية/الإعدادات، والمشتركات، وثلاث شرائح نطاق Cron، ويعمل الرد التلقائي كعمّال متوازنين (مع تقسيم الشجرة الفرعية للرد إلى شرائح agent-runner، وdispatch، وcommands/state-routing)، وتُقسَّم إعدادات gateway/server الوكيلية عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلاً من الانتظار على المصنوعات المبنية. بعد ذلك يحزم CI العادي فقط شرائح أنماط التضمين للبنية التحتية المعزولة في حزم حتمية لا تتجاوز 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج أجنحة command/cron غير المعزولة، أو agents-core ذات الحالة، أو gateway/server؛ وتبقى الأجنحة الثقيلة الثابتة على 8 vCPU بينما تستخدم المسارات المحزومة والأخف وزناً 4 vCPU. تستخدم طلبات السحب في المستودع القانوني خطة قبول مدمجة إضافية: تعمل مجموعات الإعداد نفسها في عمليات فرعية معزولة داخل خطة Linux Node الحالية المكونة من 34 مهمة، لذلك لا يسجّل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main`، والتشغيلات اليدوية، وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلاً من ملتقط Plugin المشترك العام. تسجّل شرائح أنماط التضمين إدخالات توقيت باستخدام اسم شريحة CI، لذلك يمكن لـ `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل عن شريحة مصفّاة. يحافظ `check-additional-*` على عمل ترجمة/كناري حدود الحزمة معاً ويفصل معمارية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ وتُقسّم قائمة حراس الحدود إلى شريحة كثيفة المطالبات وشريحة مدمجة واحدة لبقية خطوط الحراس، بحيث يشغّل كل منها حراساً مستقلين محددين بالتوازي ويطبع توقيتات كل فحص. يعمل فحص انجراف لقطة مطالبة المسار السعيد المكلف الخاص بـ Codex كمهمة إضافية مستقلة لـ CI اليدوي وللتغييرات المؤثرة في المطالبات فقط، لذلك لا تنتظر تغييرات Node العادية غير المرتبطة خلف توليد لقطات مطالبة باردة، وتبقى شرائح الحدود متوازنة بينما يظل انجراف المطالبة مثبتاً إلى طلب السحب الذي سببه؛ وتتخطى الراية نفسها توليد Vitest للقطات المطالبة داخل شريحة حدود دعم core للمصنوعات المبنية. تعمل مراقبة Gateway، واختبارات القنوات، وشريحة حدود دعم core بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

بعد القبول، يسمح CI القانوني على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات الأصغر fast/check؛ وتبقى Windows وAndroid عند اثنتين لأن تجمعات تلك المشغّلات أضيق.

تصدر خطة PR المدمجة 18 مهمة Node للمجموعة الحالية: تُجمّع مجموعات الإعداد الكاملة في عمليات فرعية معزولة بمهلة دفعة قدرها 120 دقيقة، بينما تشارك مجموعات أنماط التضمين ميزانية المهام المحدودة نفسها.

يشغّل Android CI كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو ملف manifest منفصلاً؛ لا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع رايات BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيح مكررة في كل دفعة ذات صلة بـ Android.

تشغّل شريحة `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية خاصة بالاعتماديات فقط مثبتة على أحدث إصدار Knip، مع تعطيل حد عمر الإصدار الأدنى الخاص بـ pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفاً جديداً غير مستخدم لم يُراجع أو يترك إدخالاً قديماً في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية، والمولّدة، والبناء، والاختبار الحي، وجسر الحزم المقصودة التي لا يستطيع Knip حلها ثابتاً.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب أو ينفذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المسائل وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المسائل؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى commit في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحّدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمداً تمرير جسم Webhook الكامل. سير العمل المستلم في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليماً افتراضياً. يتلقى وكيل ClawSweeper هدف Discord في مطالبته ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئاً، أو قابلاً للتنفيذ، أو خطراً، أو مفيداً تشغيلياً. يجب أن تؤدي الفتحات الروتينية، والتعديلات، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

عامل عناوين GitHub، والتعليقات، والأجسام، ونصوص المراجعات، وأسماء الفروع، ورسائل commit كبيانات غير موثوقة طوال هذا المسار. هي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تشغّل تشغيلات CI اليدوية مخطط المهام نفسه مثل CI العادي لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: شرائح Linux Node، وشرائح Plugin المضمّنة، وشرائح عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات دخان المصنوعات المبنية، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وبناء iOS، وi18n لواجهة Control UI. تشغّل تشغيلات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتفعّل مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستبعد الفحوصات الثابتة لما قبل إصدار Plugin، وشريحة `agentic-plugins` الخاصة بالإصدار فقط، والمسح الكامل لدفعات الامتدادات، ومسارات Docker لما قبل إصدار Plugin من CI. لا يعمل طقم Docker لما قبل الإصدار إلا عندما يشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى المجموعة الكاملة لمرشح إصدار بواسطة دفعة أو تشغيل PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط مقابل فرع، أو وسم، أو SHA commit كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                         | المهام                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | تشغيل CI اليدوي وبدائل المستودعات غير القانونية، وفحوصات جودة CodeQL JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل التوثيق خارج CI، وتمهيد install-smoke حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكراً                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، و`security-fast`، وشرائح الامتدادات الأخف وزناً، و`checks-fast-core`، وشرائح عقود Plugin/القنوات، ومعظم شرائح Linux Node المضمّنة/الأخف وزناً، و`check-guards`، و`check-prod-types`، و`check-test-types`، وشرائح `check-additional-*` المحددة، و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | أجنحة Linux Node الثقيلة المحتفظ بها، وشرائح `check-additional-*` الثقيلة الحدود/الامتدادات، و`android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، و`check-lint` (حساس بما يكفي للـ CPU بحيث كلفت 8 vCPU أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلف وقت انتظار 32-vCPU أكثر مما وفر)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ تعود الفروع المنسوخة إلى `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ تعود الفروع المنسوخة إلى `macos-26`                                                                                                                                                                                                  |

## ميزانية تسجيل المشغّلات

تسمح حاوية تسجيل مشغّلات GitHub الحالية في OpenClaw بعدد 3,000 تسجيل مشغّل ذاتي الاستضافة كل 5 دقائق. يُشارك الحد بين جميع تسجيلات مشغّلات Blacksmith في مؤسسة `openclaw`، لذلك لا تضيف إضافة تثبيت Blacksmith آخر حاوية جديدة.

عامل تسميات Blacksmith كمورد نادر للتحكم في الاندفاع. يجب أن تبقى المهام التي تقتصر على التوجيه، أو الإخطار، أو التلخيص، أو اختيار الشرائح، أو تشغيل فحوصات CodeQL قصيرة على مشغّلات GitHub المستضافة ما لم تكن لديها احتياجات خاصة بـ Blacksmith مقاسة. يجب أن تُظهر أي مصفوفة Blacksmith جديدة، أو `max-parallel` أكبر، أو سير عمل عالي التكرار عدد التسجيلات في أسوأ الحالات وأن يحافظ على الهدف على مستوى المؤسسة دون 2,000 تسجيل كل 5 دقائق، مع ترك مساحة للمستودعات المتزامنة والمهام المعاد تنفيذها.

يحافظ CI في المستودع القانوني على Blacksmith كمسار المشغّل الافتراضي لتشغيلات الدفع وطلبات السحب العادية. تستخدم تشغيلات `workflow_dispatch` وتشغيلات المستودعات غير القانونية مشغّلات GitHub المستضافة، لكن التشغيلات القانونية العادية لا تتحقق حالياً من صحة طابور Blacksmith أو تعود تلقائياً إلى تسميات GitHub المستضافة عندما يكون Blacksmith غير متاح.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## أداء OpenClaw

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميًا على `main` ويمكن تشغيله يدويًا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس علامة إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة ومؤشرات الأحدث بحسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: إنشاء ملفات تعريف CPU/الكومة/التتبع لمواضع بطء بدء التشغيل، وGateway، ودوران الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، ويتم تخطيها عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغل مسار mock-provider أيضًا مجسات مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت تشغيل Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، والخطاف، و50-Plugin؛ وRSS لاستيراد Plugin المجمعة، وحلقات ترحيب mock-OpenAI `channel-chat-baseline` المتكررة، وأوامر بدء CLI مقابل Gateway المشغل، ومجس أداء دخان حالة SQLite. عندما يكون تقرير مصدر mock-provider المنشور السابق متاحًا للمرجع المختبَر، يقارن ملخص المصدر قيم RSS والكومة الحالية بذلك الخط الأساسي ويعلّم الزيادات الكبيرة في RSS بأنها `watch`. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، وبجواره JSON الخام.

يرفع كل مسار عناصر GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأً، يثبت سير العمل أيضًا `report.json` و`report.md` والحزم و`index.md` وعناصر مجس المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. ويُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو علامة أو SHA كاملًا للالتزام، ويشغل سير عمل `CI` اليدوي بذلك الهدف، ويشغل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغل `OpenClaw Release Checks` لدخان التثبيت، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة قياس النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تتضمن ملفات التعريف المستقرة والكاملة دائمًا تغطية شاملة مباشرة/E2E وامتصاصًا لمسار إصدار Docker؛ ويمكن لملف التعريف التجريبي الاشتراك عبر `run_release_soak=true`. يعمل Telegram E2E الحزمي المعياري داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل جامع استطلاع مباشر مكررًا. بعد النشر، مرر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وDocker، وعبر أنظمة التشغيل، وTelegram بدون إعادة بناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة المباشرة لـ Plugin Codex الحالة المحددة نفسها افتراضيًا: `release_package_spec=openclaw@<tag>` المنشور يشتق `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تحزم عمليات SHA/العناصر `extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحةً لمصادر Plugin المخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) لمعرفة
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، وفروق ملفات التعريف، والعناصر، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يجري تغييرات. شغله
من `release/YYYY.M.PATCH` أو `main` بعد وجود علامة الإصدار وبعد نجاح فحص
OpenClaw npm التمهيدي. يتحقق من `pnpm plugins:sync:check`،
ويشغل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغل
`Plugin ClawHub Release` لنفس SHA الخاص بالإصدار، وعندها فقط يشغل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب النشر المستقر أيضًا
`windows_node_tag` مطابقًا تمامًا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتات x64/ARM64 الخاصة به بإدخال
`windows_node_installer_digests` المعتمد للمرشح قبل أي سير عمل فرعي للنشر، ثم يرقي
ويتحقق من ملخصات المثبتات المثبتة نفسها بالإضافة إلى أصل الرفيق الدقيق
وعقد المجموع الاختباري قبل نشر مسودة إصدار GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

لإثبات تثبيت الالتزام على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال سير عمل GitHub فروعا أو وسوما، وليست قيم SHA خام للالتزامات. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل متحقق المظلة أيضا إذا عمل أي سير عمل فرعي على
SHA مختلف.

يتحكم `release_profile` في نطاق المزود/المباشر الذي يمرر إلى فحوصات الإصدار. تستخدم
سير عمل الإصدار اليدوية `stable` افتراضيا؛ استخدم `full` فقط عندما
تريد عمدا مصفوفة المزود/الوسائط الاستشارية الواسعة. تعمل فحوصات الإصدار
المستقر والكامل دائما على تشغيل نقع مسار الإصدار المباشر/E2E وDocker الشامل؛
يمكن لملف تعريف بيتا الاشتراك باستخدام `run_release_soak=true`.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزود/الخلفية المستقرة.
- يشغل `full` مصفوفة المزود/الوسائط الاستشارية الواسعة.

تسجل المظلة معرفات التشغيل الفرعية المرسلة، وتعيد مهمة `Verify full validation` النهائية فحص استنتاجات التشغيل الفرعية الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أعيد تشغيل سير عمل فرعي وأصبح أخضر، فأعد تشغيل مهمة متحقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`plugin-prerelease` لابن ما قبل إصدار Plugin فقط، و`release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار cross-OS واحد فاشل، ادمج `rerun_group=cross-os` مع `cross_os_suite_filter`، على سبيل المثال `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية باستثناء بوابة تغطية أدوات وقت التشغيل القياسية، التي تمنع عند انحراف أدوات OpenClaw الديناميكية المطلوبة أو اختفائها من ملخص الطبقة القياسية.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم تمرر ذلك الأثر إلى فحوصات cross-OS وPackage Acceptance، بالإضافة إلى سير عمل Docker لمسار الإصدار المباشر/E2E عند تشغيل تغطية النقع. هذا يحافظ على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تحزيم المرشح نفسه في عدة مهام فرعية. بالنسبة إلى مسار Codex npm-plugin المباشر، تمرر فحوصات الإصدار إما مواصفة Plugin منشورة مطابقة مشتقة من `release_package_spec`، أو تمرر `codex_plugin_spec` التي قدمها المشغل، أو تترك الإدخال فارغا كي يحزم سكربت Docker إضافة Codex الخاصة بالخروج المحدد.

عمليات تشغيل `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل فرعي
كان قد أرسله بالفعل عند إلغاء الأصل، لذلك لا يبقى تحقق main الأحدث
خلف تشغيل release-check قديم لساعتين. تحافظ عمليات تحقق فرع/وسم الإصدار
ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## الشظايا المباشرة وE2E

يحافظ ابن الإصدار المباشر/E2E على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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
- شظايا صوت/فيديو الوسائط المقسمة وشظايا الموسيقى المصفاة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص إخفاقات المزود المباشر البطيئة. تظل أسماء الشظايا المجمعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شظايا الوسائط المباشرة الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق أجنحة الاختبار المباشرة المدعومة بـ Docker على مشغلات Blacksmith العادية، فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker المتداخلة.

تستخدم شظايا النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة باسم `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت مختار. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker الحي، وGateway المجزأ حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة اختبار Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شظايا Gateway Docker حدود `timeout` صريحة على مستوى السكربت تكون أقل من مهلة مهمة سير العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كلها. إذا أعادت تلك الشظايا بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مضبوط بشكل خاطئ وسيهدر وقت التنفيذ على بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: إذ يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من ملف tarball واحد عبر حزمة اختبار Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. تتحقق `resolve_package` من `workflow_ref`، وتحل مرشح حزمة واحدا، وتكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، وتكتب `.artifacts/docker-e2e-package/package-candidate.json`، وترفع كليهما كأثر `package-under-test`، وتطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance` ملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون ملف tarball، ويحضّر صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المختارة ضد تلك الحزمة بدلا من حزم نسخة checkout الخاصة بسير العمل. عندما يختار ملف تعريفي عدة `docker_lanes` موجهة، يحضر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker موجهة متوازية مع آثار فريدة.
3. تستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. تعمل عندما لا يكون `telegram_mode` هو `none` وتثبت أثر `package-under-test` نفسه عندما يحل قبول الحزمة واحدا؛ وما يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعا أو وسمًا أو SHA تثبيت كاملا موثوقا في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التثبيت المختار قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عاما عبر HTTPS؛ ويكون `package_sha256` مطلوبا. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيف الخاصة/الداخلية/ذات الاستخدام الخاص أو عناوين IP المحلولة، وعمليات إعادة التوجيه خارج سياسة السلامة العامة نفسها.
- ينزل `source=trusted-url` ملف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ ويكون `package_sha256` و`trusted_source_id` مطلوبين. استخدم هذا فقط لمرايا المؤسسات التي يملكها المشرفون أو مستودعات الحزم الخاصة التي تحتاج إلى مضيفين أو منافذ أو بادئات مسارات أو مضيفي إعادة توجيه أو حل شبكة خاصة مضبوطة. إذا أعلنت السياسة مصادقة bearer، يستخدم سير العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ وما تزال بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختياريا ولكن ينبغي تقديمه للآثار المشتركة خارجيا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/حزمة الاختبار الموثوق الذي يشغل الاختبار. `package_ref` هو تثبيت المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح ذلك لحزمة الاختبار الحالية التحقق من تثبيتات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزم

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكامل مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم الملف التعريفي `package` تغطية إضافات غير متصلة بحيث لا يعتمد تحقق الحزمة المنشورة على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

للاطلاع على سياسة اختبار التحديثات والإضافات المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات والإضافات](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يبقي ذلك إثبات ترحيل الحزمة، والتحديث، وتثبيت مهارة ClawHub الحية، وتنظيف تبعيات الإضافات القديمة، وإصلاح تثبيت الإضافات المضبوطة، والإضافة غير المتصلة، وتحديث الإضافة، وTelegram على ملف tarball نفسه للحزمة المحلولة. عيّن `release_package_spec` في Full Release Validation أو OpenClaw Release Checks بعد نشر إصدار تجريبي لتشغيل المصفوفة نفسها على حزمة npm المشحونة دون إعادة البناء؛ وعيّن `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. ما تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي التهيئة الأولية الخاصة بنظام التشغيل، والمثبت، وسلوك المنصة؛ وينبغي أن يبدأ تحقق المنتج للحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة لكل تشغيل في مسار الإصدار الحاجز. في قبول الحزمة، يكون ملف tarball المحلول `package-under-test` هو المرشح دائما، ويختار `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيم `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة، بالإضافة إلى إصدارات حدود توافق الإضافات المثبتة، وتجهيزات على شكل مشكلات لإعدادات Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات إضافات OpenClaw المضبوطة، ومسارات السجلات ذات علامة التلدة، وجذور تبعيات الإضافات القديمة البالية. يتم تجزئة اختيارات ناجي الترقية المنشور متعدد الخطوط الأساسية حسب الخط الأساسي إلى مهام تشغيل Docker موجهة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديثات المنشورة بشكل شامل، وليس اتساع CI العادي للإصدار الكامل. يمكن لتشغيلات التجميع المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يضبط المسار المنشور الخط الأساسي بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويتحقق من `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows للحزمة والمثبت الجديدة أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز تحكم بالمتصفح من مسار Windows خام مطلق. يستخدم اختبار الدخان لدورة الوكيل عبر أنظمة التشغيل لـ OpenAI القيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيا عندما تكون مضبوطة، وإلا يستخدم `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

يحتوي قبول الحزمة على نوافذ توافق قديمة محدودة للحزم المنشورة مسبقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يشذب `update-channel-switch` قيم pnpm `patchedDependencies` المفقودة من تجهيز git الزائف المشتق من ملف tarball، وقد يسجل قيمة `update.channel` المستمرة المفقودة؛
- قد تقرأ اختبارات دخان الإضافات مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع الاستمرار في طلب بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا من ملفات ختم بيانات تعريف البناء المحلي التي شُحنت بالفعل. يجب أن تلبي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

عند تصحيح فشل تشغيل قبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة، وإصدارها، وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثاره في Docker: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية اختبار الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin SDK/القناة/Gateway/Plugin الأساسية التي تمارسها مهام Docker smoke. لا تحجز تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات التوثيق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل smoke CLI لحذف مساحة العمل المشتركة للوكلاء، ويشغّل e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء لإضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود لـ Plugin المضمّن ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع تحديد تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت حزمة QR وDocker/التحديث للمثبّت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات الإصدارات عبر workflow-call، وطلبات السحب التي تلمس فعلا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة smoke واحدة لـ GHCR root Dockerfile خاصة بـ target-SHA، ثم يشغّل تثبيت حزمة QR، وsmokes لـ Dockerfile/Gateway الجذرية، وsmokes للمثبّت/التحديث، وDocker E2E السريع لـ Plugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف smokes الصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند الدفع، يبقي سير العمل Docker smoke السريع ويترك install smoke الكامل للتحقق الليلي أو تحقق الإصدار.

يُحرس smoke البطيء لتثبيت Bun العام لموفر الصور بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات التشغيل اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تشغّله. ما يزال CI العادي لطلبات السحب يشغّل مسار انحدار مشغّل Bun السريع للتغييرات ذات الصلة بـ Node. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة live-test مشتركة مسبقا، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### الإعدادات القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات التجمع الرئيسي للمسارات العادية.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات تجمع الذيل الحساس للموفر.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات الحية المتزامنة حتى لا تخنق الموفرات.                                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | حد مسارات تثبيت npm المتزامنة.                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد المسارات المتزامنة متعددة الخدمات.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | التباعد بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبط `0` لعدم وجود تباعد.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات live/tail المحددة حدودا أضيق.              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز cleanup smoke حتى يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

ما يزال بإمكان مسار أثقل من حده الفعلي أن يبدأ من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تنفذ التحضيرات الإجمالية المحلية فحوصات Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل live/E2E قابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، وصورة live، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أداة حزمة من التشغيل الحالي، أو ينزّل أداة حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة ببصمة الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور بصمة الحزمة الموجودة بدلا من إعادة البناء. تتم إعادة محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى تعاد محاولة دفق سجل/ذاكرة تخزين مؤقت عالق بسرعة بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تشغّل تغطية Docker للإصدار مهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار حزمة Codex Plugin الحي، الذي يثبت حزمة OpenClaw المرشحة، ويثبت Codex Plugin من `codex_plugin_spec` أو tarball بالمرجع نفسه مع موافقة صريحة على تثبيت Codex CLI، ويشغّل فحصا تمهيديا لـ Codex CLI، ثم يشغّل عدة دورات OpenClaw agent في الجلسة نفسها ضد OpenAI. تبقى `plugins-runtime-core`، و`plugins-runtime`، و`plugins-integrations` أسماء مستعارة تجميعية لـ Plugin/وقت التشغيل. يبقى الاسم المستعار لمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبّت الموفر.

يُطوى OpenWebUI داخل `plugins-runtime-services` عندما تطلبه تغطية release-path الكاملة، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات التشغيل الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة لإخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل إدخال سير العمل `docker_lanes` المسارات المحددة ضد الصور المجهزة بدلا من مهام الأجزاء، ما يبقي تصحيح أخطاء المسار الفاشل محدودا بمهمة Docker مستهدفة واحدة ويجهّز أداة الحزمة لتلك التشغيله أو ينزّلها أو يعيد استخدامها؛ إذا كان مسار محدد مسارا حيا في Docker، تبني المهمة المستهدفة صورة live-test محليا لإعادة التشغيل تلك. تتضمن أوامر GitHub المولدة لإعادة التشغيل لكل مسار `package_artifact_run_id`، و`package_artifact_name`، ومدخلات الصور المجهزة عندما توجد هذه القيم، حتى يمكن لمسار فاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## ما قبل إصدار Plugin

`Plugin Prerelease` هي تغطية منتج/حزمة أعلى تكلفة، لذلك فهي سير عمل منفصل يتم تشغيله بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات تشغيل CI اليدوية المستقلة، هذه المجموعة مطفأة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال إضافات؛ تشغّل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي تكوين Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة كومة Node أكبر حتى لا تنشئ دفعات Plugin الثقيلة في الاستيراد مهام CI إضافية. يجمّع مسار Docker لما قبل الإصدار الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام مدتها من دقيقة إلى ثلاث دقائق. يرفع سير العمل أيضا أداة معلوماتية باسم `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ تعد نتائج inspector مدخلا للفرز ولا تغير بوابة Plugin Prerelease الحاجزة.

## QA Lab

لدى QA Lab مسارات CI مخصصة خارج سير العمل الرئيسي الذكي النطاق. يكون تكافؤ الوكلاء متداخلا تحت أحزمة QA والإصدار الواسعة، وليس سير عمل PR مستقلا. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي للتكافؤ أن يسير مع تشغيل تحقق واسع.

- يشغّل سير عمل `QA-Lab - All Lanes` ليلا على `main` وعند التشغيل اليدوي؛ ويوسّع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود إيجار Convex.

تشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram باستخدام الموفر الوهمي الحتمي والنماذج المؤهلة وهميا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء Plugin الموفر العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال الموفر مجموعات النموذج الحي، والموفر الأصلي، وموفر Docker المنفصلة.

تستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI الذي تم checkout له ذلك. يبقى إدخال CLI الافتراضي وسير العمل اليدوي `all`؛ تشغيل `matrix_profile=all` اليدوي يجزئ دائما تغطية Matrix الكاملة إلى مهام `transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ تشغّل بوابة تكافؤ QA الخاصة به حزمي المرشح والأساس كمهام مسارات متوازية، ثم تنزّل الأداتين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع دليل CI/الفحص المحدد النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدا ماسح أمني ضيق للمرور الأول، وليس مسحا كاملا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions بالإضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمنية عالية الثقة مفلترة إلى `security-severity` عالي/حرج.

تبقى حراسة طلب السحب خفيفة: لا تبدأ إلا للتغييرات تحت `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط أساس المصادقة والأسرار وبيئة العزل وcron وgateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية، إضافة إلى وقت تشغيل Plugin القناة، وgateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                 |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF الأساسية، وتحليل IP، وحارس الشبكة، وweb-fetch، وSSRF في Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                    |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                       |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android مجدول. يبني تطبيق Android يدويًا لأجل CodeQL على أصغر مشغّل Blacksmith Linux تقبله فحوصات سلامة سير العمل. يرفع ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لأجل CodeQL على Blacksmith macOS، ويستبعد نتائج بناء التبعيات من SARIF المرفوع، ويرفع ضمن `/codeql-critical-security/macos`. أُبقي خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو جزء الجودة غير الأمني المقابل. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة أخطاء، على أسطح ضيقة عالية القيمة، على مشغّلات Linux المستضافة في GitHub حتى لا تستهلك فحوصات الجودة ميزانية تسجيل مشغّلات Blacksmith. حارس طلبات السحب الخاص به أصغر عمدًا من ملف التعريف المجدول: طلبات السحب غير المسودة تشغّل فقط الأجزاء المطابقة `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوزيع الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/بيئة العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/ربط SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسات/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل ردود Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغّل كل أجزاء جودة طلبات السحب الاثني عشر.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                   | السطح                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وبيئة العزل وcron وgateway                                                                                                       |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات والترحيل والتطبيع والإدخال والإخراج                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوزيع النماذج/المزوّدين، وتوزيع الرد التلقائي وطوابيره، وعقود وقت تشغيل مستوى تحكم ACP                                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وربط تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزيع الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط                      |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                       |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد Control UI، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل الجلب/البحث على الويب الأساسية، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                               |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول Plugin SDK                                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                                  |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمّنة كعمل متابعة محدود النطاق أو مجزأ فقط بعد أن تستقر ملفات التعريف الضيقة في زمن التشغيل والإشارة.

## سير عمل الصيانة

### وكيل الوثائق

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء الوثائق الحالية متوافقة مع التغييرات التي هبطت مؤخرًا. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح بدفع غير آلي على `main` أن يشغّله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات workflow-run التنفيذ عندما يكون `main` قد تقدم، أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أُنشئ خلال الساعة الأخيرة. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يستطيع تشغيل واحد كل ساعة تغطية كل تغييرات main المتراكمة منذ آخر مرور على الوثائق.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح بدفع غير آلي على `main` أن يشغّله، لكنه يتخطى التنفيذ إذا كان استدعاء workflow-run آخر قد شُغّل أو يعمل بالفعل في ذلك اليوم بالتوقيت العالمي المنسق. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعًا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمّع زمن الجدار لكل إعداد وأقصى RSS على Linux وmacOS، بحيث يُظهر مقارنة ما قبل/ما بعد فروقات ذاكرة الاختبارات إلى جانب فروقات المدة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفعة الروبوت، يعيد المسار تأسيس الرقعة التي تم التحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع من جديد؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف في GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع سلامة drop-sudo نفسه مثل وكيل الوثائق.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يضبط افتراضيًا على التشغيل الجاف ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط قد دُمج وأن كل تكرار يملك إما قضية مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية والتوجيه حسب التغييرات

منطق مسارات التغييرات المحلية موجود في `scripts/changed-lanes.mjs` وينفذه `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أشد صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغّل فحص أنواع الإنتاج الأساسي واختبارات الأساس، إضافة إلى lint/الحراس الأساسيين؛
- تغييرات الاختبارات الأساسية فقط تشغّل فحص أنواع الاختبارات الأساسية فقط إضافة إلى lint الأساسي؛
- تغييرات إنتاج الإضافات تشغّل فحص أنواع إنتاج الإضافات واختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات اختبارات الإضافات فقط تشغّل فحص أنواع اختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات Plugin SDK العام أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على تلك العقود الأساسية (تبقى عمليات مسح إضافات Vitest عمل اختبار صريحًا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوصات موجهة للإصدار/الإعدادات/تبعيات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

توجيه اختبارات التغييرات المحلية موجود في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد الخرائط الصريحة: التغييرات في إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجّه نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack، بحيث يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا على مستوى عدة الاختبار بما يكفي بحيث لا تكون المجموعة المرسومة الرخيصة بديلًا موثوقًا.

## تحقق Testbox

Crabbox هو غلاف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص أوسع من حلقة تحرير محلية، أو عندما تكون
مطابقة CI مهمة، أو عندما يحتاج الإثبات إلى أسرار أو Docker أو مسارات حزم أو
صناديق قابلة لإعادة الاستخدام أو سجلات بعيدة. خلفية OpenClaw العادية هي
`blacksmith-testbox`؛ وتُعد سعة AWS/Hetzner المملوكة بديلًا عند انقطاعات Blacksmith
أو مشكلات الحصة أو الاختبار الصريح بسعة مملوكة.

تقوم عمليات Crabbox المدعومة من Blacksmith بتجهيز صناديق Testbox، وحجزها، ومزامنتها، وتشغيلها، والإبلاغ عنها، وتنظيفها
لمرة واحدة. يفشل فحص سلامة المزامنة المدمج بسرعة عندما تختفي ملفات الجذر
المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 عملية حذف متتبعة. بالنسبة إلى طلبات PR ذات الحذف الكبير المقصود، عيّن
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI محليًا يبقى في
مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملفًا ثنائيًا قديمًا من Crabbox لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً حتى لو كانت `.crabbox.yaml` تحتوي على إعدادات افتراضية للسحابة المملوكة. في أشجار عمل Codex أو الخروج المرتبط/المتناثر، تجنب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يعيد تسوية الاعتماديات قبل بدء Crabbox؛ استدعِ غلاف node مباشرةً بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب العمليات المدعومة من Blacksmith الإصدار Crabbox 0.22.0 أو أحدث حتى يحصل الغلاف على سلوك مزامنة Testbox والطابور والتنظيف الحالي. عند استخدام الخروج الشقيق، أعد بناء الملف الثنائي المحلي المتجاهل قبل أعمال التوقيت أو الإثبات:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId`
و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. بالنسبة إلى عمليات
Blacksmith Testbox المفوضة، يكون رمز خروج غلاف Crabbox وملخص JSON هما
نتيجة الأمر. تملك عملية GitHub Actions المرتبطة التهيئة وإبقاء الاتصال نشطًا؛ يمكن أن
تنتهي بالحالة `cancelled` عندما يتم إيقاف Testbox خارجيًا بعد أن يكون أمر SSH
قد عاد بالفعل. تعامل مع ذلك كأثر تنظيف/حالة ما لم يكن
`exitCode` في الغلاف غير صفري أو تُظهر مخرجات الأمر اختبارًا فاشلًا.
ينبغي أن توقف عمليات Crabbox المدعومة من Blacksmith لمرة واحدة Testbox تلقائيًا؛
إذا قوطعت عملية تشغيل أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط
الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق المهيأ نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كان Crabbox هو الطبقة المعطلة لكن Blacksmith نفسه يعمل، فاستخدم
Blacksmith مباشرةً للتشخيص فقط، مثل `list` و`status` والتنظيف. أصلح
مسار Crabbox قبل التعامل مع تشغيل Blacksmith مباشر كإثبات للمشرف.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات
التجهيز الجديدة تبقى `queued` من دون IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فتعامل مع ذلك كضغط في مزوّد Blacksmith أو الطابور أو الفوترة أو حدود المؤسسة. أوقف
المعرّفات الموجودة في الطابور التي أنشأتها، وتجنب بدء صناديق Testbox إضافية، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يتحقق شخص ما من لوحة معلومات Blacksmith
والفوترة وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو تكون السعة المملوكة هي الهدف صراحةً:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تعتمد `.crabbox.yaml` المملوكة للمستودع افتراضيًا على `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع عقود AWS عبر الوسيط المنطقة/السوق المحددين، وضغط الحصة، والرجوع إلى Spot، وتحذيرات فئات الضغط العالي. استخدم `fast` للفحوص العريضة الأثقل، و`large` فقط بعد أن لا يكون standard/fast كافيين، و`beast` فقط للمسارات الاستثنائية المقيدة بالمعالج مثل الحزمة الكاملة أو مصفوفات Docker لكل Plugins، أو تحقق الإصدار/الحاجب الصريح، أو توصيف الأداء عالي الأنوية. لا تستخدم `beast` من أجل `pnpm check:changed`، أو الاختبارات المركزة، أو العمل الخاص بالتوثيق فقط، أو lint/typecheck الاعتيادي، أو إعادة إنتاج E2E صغيرة، أو فرز تعطل Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط تقلب سوق Spot بالإشارة.

تملك `.crabbox.yaml` إعدادات المزوّد والمزامنة وتهيئة GitHub Actions الافتراضية لمسارات السحابة المملوكة. تستثني `.git` المحلي حتى يحتفظ خروج Actions المهيأ ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية للمشرف، وتستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. تملك `.github/workflows/crabbox-hydrate.yml` الخروج، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

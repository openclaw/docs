---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت بصدد تصحيح أخطاء فحص فاشل في GitHub Actions
    - أنت تنسّق تشغيل تحقق الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو تمرير نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: خط أنابيب CI
x-i18n:
    generated_at: "2026-07-04T18:01:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

تعمل CI الخاصة بـ OpenClaw عند كل دفع إلى `main` وكل طلب سحب. تمر عمليات الدفع
الأساسية إلى `main` أولا عبر نافذة قبول مدتها 90 ثانية على مشغل مستضاف.
تلغي مجموعة التزامن الحالية `CI` ذلك التشغيل المنتظر عندما يصل
التزام أحدث، لذلك لا تسجل عمليات الدمج المتتابعة كل منها مصفوفة Blacksmith
كاملة. تتجاوز طلبات السحب وعمليات التشغيل اليدوية هذا الانتظار. بعد ذلك تصنف مهمة `preflight`
الفرق وتوقف المسارات المكلفة عندما لا تكون قد تغيرت إلا
مناطق غير مرتبطة. تتجاوز تشغيلات `workflow_dispatch` اليدوية عمدا
النطاق الذكي وتوسع المخطط الكامل لمرشحي الإصدار والتحقق
الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية
Plugin الخاصة بالإصدار فقط في سير عمل [`Plugin قبل الإصدار`](#plugin-prerelease)
المنفصل ولا تعمل إلا من [`التحقق الكامل من الإصدار`](#full-release-validation)
أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                              | الغرض                                                                                                     | متى تعمل                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، وامتدادات extensions المتغيرة، وبناء بيان CI             | دائما في عمليات الدفع وطلبات السحب غير المسودة      |
| `runner-admission`                 | تهدئة مستضافة مدتها 90 ثانية لعمليات الدفع الأساسية إلى `main` قبل تسجيل عمل Blacksmith                  | كل تشغيل CI؛ ينتظر فقط عند عمليات الدفع الأساسية إلى `main` |
| `security-fast`                    | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق ملف القفل للإنتاج                  | دائما في عمليات الدفع وطلبات السحب غير المسودة      |
| `check-dependencies`               | مرور Knip الخاص بتبعيات الإنتاج فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                  | تغييرات مرتبطة بـ Node                              |
| `build-artifacts`                  | بناء `dist/`، وواجهة Control UI، وفحوص دخان CLI المبنية، وفحوص المخرجات المبنية المضمنة، والمخرجات القابلة لإعادة الاستخدام | تغييرات مرتبطة بـ Node                              |
| `checks-fast-core`                 | مسارات صحة Linux السريعة مثل المضمنة، والبروتوكول، وQA Smoke CI، وفحوص توجيه CI                          | تغييرات مرتبطة بـ Node                              |
| `checks-fast-contracts-plugins-*`  | فحصا عقود Plugin مقسمان إلى شظايا                                                                        | تغييرات مرتبطة بـ Node                              |
| `checks-fast-contracts-channels-*` | فحصا عقود القنوات مقسمان إلى شظايا                                                                       | تغييرات مرتبطة بـ Node                              |
| `checks-node-core-*`               | شظايا اختبارات Node الأساسية، باستثناء مسارات القنوات، والمضمنة، والعقود، وextensions                    | تغييرات مرتبطة بـ Node                              |
| `check-*`                          | مكافئ البوابة المحلية الرئيسية المقسمة إلى شظايا: أنواع الإنتاج، والتدقيق، والحراس، وأنواع الاختبار، ودخان صارم | تغييرات مرتبطة بـ Node                              |
| `check-additional-*`               | البنية، وانحراف الحدود/المطالبات المقسم إلى شظايا، وحراس extensions، وحدود الحزم، وطوبولوجيا وقت التشغيل | تغييرات مرتبطة بـ Node                              |
| `checks-node-compat-node22`        | بناء توافق Node 22 ومسار دخان                                                                            | تشغيل CI يدوي للإصدارات                             |
| `check-docs`                       | تنسيق الوثائق، والتدقيق، وفحوص الروابط المعطلة                                                          | عند تغير الوثائق                                    |
| `skills-python`                    | Ruff + pytest من أجل Skills المدعومة بـ Python                                                           | تغييرات مرتبطة بـ Skills الخاصة بـ Python           |
| `checks-windows`                   | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة     | تغييرات مرتبطة بـ Windows                           |
| `macos-node`                       | مسار اختبار TypeScript على macOS باستخدام المخرجات المبنية المشتركة                                      | تغييرات مرتبطة بـ macOS                             |
| `macos-swift`                      | تدقيق Swift، والبناء، والاختبارات لتطبيق macOS                                                           | تغييرات مرتبطة بـ macOS                             |
| `ios-build`                        | توليد مشروع Xcode إضافة إلى بناء محاكي تطبيق iOS                                                         | تطبيق iOS، أو عدة التطبيق المشتركة، أو تغييرات Swabble |
| `android`                          | اختبارات وحدة Android لكلتا النكهتين إضافة إلى بناء APK تصحيح واحد                                       | تغييرات مرتبطة بـ Android                           |
| `test-performance-agent`           | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                        | نجاح CI الرئيسية أو تشغيل يدوي                      |
| `openclaw-performance`             | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات موفر وهمي، وملف تعريف عميق، وGPT 5.5 مباشر      | مجدول وتشغيل يدوي                                   |

## ترتيب الفشل السريع

1. ينتظر `runner-admission` فقط عمليات الدفع الأساسية إلى `main`؛ يؤدي دفع أحدث إلى إلغاء التشغيل قبل تسجيل Blacksmith.
2. يقرر `preflight` أي المسارات توجد أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهاما مستقلة.
3. تفشل `security-fast` و`check-*` و`check-additional-*` و`check-docs` و`skills-python` بسرعة دون انتظار مهام المخرجات ومصفوفة المنصات الأثقل.
4. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد جاهزية البناء المشترك.
5. بعد ذلك تتوسع مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-plugins-*` و`checks-fast-contracts-channels-*` و`checks-node-core-*` و`checks-windows` و`macos-node` و`macos-swift` و`ios-build` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عند وصول دفع أحدث إلى نفس طلب السحب أو مرجع `main`. تعامل مع ذلك كضجيج CI إلا إذا كان أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، ويبلغ `build-artifacts` عن إخفاقات القنوات المضمنة، وحدود دعم النواة، ومراقبة Gateway مباشرة بدلا من وضع مهام تحقق صغيرة في الطابور. مفتاح تزامن CI التلقائي مصدار (`CI-v7-*`) حتى لا يتمكن تشغيل عالق من جهة GitHub في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى ما لا نهاية. تستخدم التشغيلات اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

استخدم `pnpm ci:timings` أو `pnpm ci:timings:recent` أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص وقت الجدار، ووقت الطابور، وأبطأ المهام، والإخفاقات، وحاجز توسع `pnpm-store-warmup` من GitHub Actions. ترفع CI أيضا ملخص التشغيل نفسه كمخرج `ci-timings-summary`. لتوقيت البناء، تحقق من خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` العبارة `[build-all] phase timings:` ويتضمن `ui:build`؛ كما ترفع المهمة مخرج `startup-memory`.

بالنسبة إلى تشغيلات طلبات السحب، تشغل مهمة ملخص التوقيت النهائية المساعد من مراجعة الأساس الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. يبقي ذلك الاستعلام الذي يحمل الرمز المميز خارج الكود المتحكم به من الفرع، مع الاستمرار في تلخيص تشغيل CI الحالي لطلب السحب.

## سياق طلب السحب والأدلة

تشغل طلبات سحب المساهمين الخارجيين بوابة سياق طلب السحب والأدلة من
`.github/workflows/real-behavior-proof.yml`. يتحقق سير العمل من الالتزام الأساسي الموثوق
ويقيّم متن طلب السحب فقط؛ ولا ينفذ كودا من
فرع المساهم.

تنطبق البوابة على مؤلفي طلبات السحب الذين ليسوا مالكي المستودع أو أعضاءه أو
متعاونين أو بوتات. تنجح عندما يحتوي متن طلب السحب على قسمي
`What Problem This Solves` و`Evidence` من تأليف الكاتب. يمكن أن تكون الأدلة اختبارا مركزا،
أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو مخرجات طرفية، أو ملاحظة مباشرة،
أو سجلا منقحا، أو رابط مخرج. يوفر المتن النية والتحقق المفيد؛
ويفحص المراجعون الكود والاختبارات وCI لتقييم الصحة.

عند فشل الفحص، حدّث متن طلب السحب بدلا من دفع التزام كود آخر.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من مخطط CI الخاص بـ Node إضافة إلى تدقيق سير العمل، لكنها لا تجبر بذاتها عمليات بناء Windows أو iOS أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات مرتبطة بتغييرات مصدر المنصة.
- **سلامة سير العمل** تشغل `actionlint` و`zizmor` على كل ملفات YAML الخاصة بسير العمل، وحارس استيفاء الإجراء المركب، وحارس علامات التعارض. كما تشغل مهمة `security-fast` محددة النطاق بطلب السحب `zizmor` على ملفات سير العمل المتغيرة حتى تفشل نتائج أمان سير العمل مبكرا في مخطط CI الرئيسي.
- **الوثائق عند عمليات الدفع إلى `main`** يفحصها سير عمل `Docs` المستقل باستخدام مرآة وثائق ClawHub نفسها التي تستخدمها CI، لذلك لا تؤدي عمليات الدفع المختلطة بين الكود والوثائق أيضا إلى وضع شظية `check-docs` الخاصة بـ CI في الطابور. لا تزال طلبات السحب وCI اليدوية تشغل `check-docs` من CI عند تغير الوثائق.
- **TUI PTY** يعمل في شظية Linux Node `checks-node-core-runtime-tui-pty` لتغييرات TUI. تشغل الشظية `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك تغطي كلا من مسار تجهيز `TuiBackend` الحتمي ودخان `tui --local` الأبطأ الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات اختبارات النواة الرخيصة المختارة، وتعديلات مساعد/توجيه اختبارات عقود Plugin الضيقة** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار مخرجات البناء، وتوافق Node 22، وعقود القنوات، وشظايا النواة الكاملة، وشظايا Plugin المضمنة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودا بأسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- **فحوص Windows Node** محددة النطاق بأغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغلات npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ وتبقى تغييرات المصدر غير المرتبط، وPlugin، ودخان التثبيت، والتغييرات الخاصة بالاختبارات فقط على مسارات Linux Node.

تُقسَّم أبطأ عائلات اختبارات Node أو تُوازَن بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغّلات: تعمل عقود Plugin وعقود القنوات كلٌّ منها كشظيتين موزونتين مدعومتين من Blacksmith مع الرجوع القياسي إلى مشغّل GitHub، وتعمل مسارات core unit fast/support على نحو منفصل، وتُقسَّم بنية core runtime التحتية بين state وprocess/config وshared وثلاث شظايا نطاق cron، ويعمل auto-reply كعاملين متوازنين (مع تقسيم شجرة reply الفرعية إلى شظايا agent-runner وdispatch وcommands/state-routing)، وتُقسَّم إعدادات agentic gateway/server عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلاً من انتظار المخرجات المبنية. بعد ذلك، تجمع CI العادية فقط شظايا أنماط التضمين للبنية التحتية المعزولة في حزم حتمية لا تتجاوز 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج مجموعات non-isolated command/cron أو stateful agents-core أو gateway/server؛ تبقى المجموعات الثقيلة الثابتة على 8 vCPU بينما تستخدم المسارات المحزومة والأخف وزناً 4 vCPU. تستخدم طلبات السحب على المستودع القانوني خطة قبول مضغوطة إضافية: تعمل مجموعات per-config نفسها في عمليات فرعية معزولة داخل خطة Linux Node الحالية ذات 34 مهمة، بحيث لا يسجّل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main` وعمليات الإرسال اليدوية وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلاً من التجميعة المشتركة العامة للـ Plugin. تسجّل شظايا أنماط التضمين إدخالات التوقيت باستخدام اسم شظية CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وشظية مُرشَّحة. يُبقي `check-additional-*` عمل compile/canary المرتبط بحدود الحزم معاً ويفصل معمارية طوبولوجيا runtime عن تغطية gateway watch؛ تُخطَّط قائمة حراس الحدود إلى شظية واحدة كثيفة المطالبات وشظية مشتركة واحدة لبقية خطوط الحراسة، حيث تشغّل كل منهما حراساً مستقلين محددين بالتوازي وتطبع توقيتات لكل فحص. يعمل فحص انحراف لقطة مطالبة happy-path في Codex، المكلف، كمهمة إضافية مستقلة لـ CI اليدوية وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير المرتبطة خلف توليد لقطة مطالبات بارد وتبقى شظايا الحدود متوازنة، مع استمرار ربط انحراف المطالبات بطلب السحب الذي سببه؛ وتتجاوز العلامة نفسها توليد Vitest للقطات المطالبات داخل شظية core support-boundary المبنية من المخرجات. تعمل Gateway watch واختبارات القنوات وشظية core support-boundary بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

بعد القبول، تسمح CI القانونية على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات الأصغر fast/check؛ وتبقى Windows وAndroid عند اثنتين لأن تجمعات هذه المشغّلات أضيق.

تُصدر خطة PR المضغوطة 18 مهمة Node للمجموعة الحالية: تُجمَّع مجموعات whole-config في عمليات فرعية معزولة مع مهلة دفعة تبلغ 120 دقيقة، بينما تشترك مجموعات أنماط التضمين في ميزانية المهام المحدودة نفسها.

تشغّل Android CI كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم تبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بياناً منفصلاً؛ ما يزال مسار unit-test الخاص بها يصرّف النكهة مع علامات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف debug APK مكررة في كل دفعة ذات صلة بـ Android.

تشغّل شظية `check-dependencies` الأمر `pnpm deadcode:dependencies` (مرور إنتاجي من Knip مخصص للتبعيات فقط ومثبت على أحدث إصدار من Knip، مع تعطيل الحد الأدنى لعمر الإصدار في pnpm لتثبيت `dlx`) وتشغّل `pnpm deadcode:unused-files`، الذي يقارن نتائج الملفات الإنتاجية غير المستخدمة من Knip مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف PR ملفاً غير مستخدم جديداً لم يُراجع أو يترك إدخال allowlist قديماً، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبار الحي وجسور الحزم المتعمدة التي لا يستطيع Knip حلها ثابتاً.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يتضمن سير العمل أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه عامل ClawSweeper.

يمرّر مسار `github_activity` البيانات الوصفية المطبّعة فقط: نوع الحدث، الإجراء، الفاعل، المستودع، رقم العنصر، URL، العنوان، الحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمداً تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، وينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لعامل ClawSweeper.

النشاط العام ملاحظة، وليس تسليماً افتراضياً. يتلقى عامل ClawSweeper هدف Discord في مطالبته وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئاً أو قابلاً للتنفيذ أو محفوفاً بالمخاطر أو مفيداً تشغيلياً. ينبغي أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج البوتات، وضوضاء Webhook المكررة، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو runtime العامل.

## عمليات الإرسال اليدوية

تشغّل عمليات إرسال CI اليدوية مخطط المهام نفسه مثل CI العادية لكنها تجبر كل مسار محدد غير Android على التشغيل: شظايا Linux Node، وشظايا Plugin المحزومة، وشظايا عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات smoke للمخرجات المبنية، وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وبناء iOS، وControl UI i18n. تشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستثنى من CI فحوصات Plugin prerelease الثابتة، وشظية `agentic-plugins` الخاصة بالإصدار فقط، والمسح الدفعي الكامل للإضافات، ومسارات Docker الخاصة بـ Plugin prerelease. تعمل مجموعة Docker prerelease فقط عندما ترسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة release-validation.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة بحيث لا تُلغى مجموعة release-candidate كاملة بسبب دفعة أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط ضد فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

مسار extended-stable الشهري الخاص بـ npm فقط هو الاستثناء: أرسل كلاً من تمهيد `OpenClaw NPM
Release` و`Full Release Validation` من فرع
`extended-stable/YYYY.M.33` الدقيق، واحتفظ بمعرفات تشغيلهما، ومرّر كلا المعرفين إلى تشغيل
النشر المباشر في npm. راجع [النشر الشهري لـ extended-stable الخاص بـ npm فقط](/ar/reference/RELEASING#monthly-npm-only-extended-stable-publication) للأوامر ومتطلبات الهوية الدقيقة وقراءة السجل وإجراء إصلاح المحدد. لا يرسل هذا المسار Plugin أو macOS أو Windows أو GitHub
Release أو private dist-tag أو أي نشر لمنصة أخرى.

## المشغّلات

| المشغّل                          | المهام                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | إرسال CI اليدوي ورجوعات المستودعات غير القانونية، وفحوصات جودة CodeQL لـ JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل الوثائق خارج CI، وتمهيد install-smoke بحيث تستطيع مصفوفة Blacksmith الاصطفاف مبكراً                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight` و`security-fast` وشظايا الإضافات الأخف وزناً و`checks-fast-core` باستثناء QA Smoke CI، وشظايا عقود Plugin/القنوات، ومعظم شظايا Linux Node المحزومة/الأخف وزناً، و`check-guards` و`check-prod-types` و`check-test-types` وشظايا محددة من `check-additional-*` و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعات Linux Node الثقيلة المحتفظ بها، وشظايا `check-additional-*` كثيفة الحدود/الإضافات، و`android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI، و`build-artifacts` في CI وTestbox، و`check-lint` (حساس بما يكفي للمعالج بحيث كلّفت 8 vCPU أكثر مما وفرت)؛ وبُنى Docker الخاصة بـ install-smoke (كلّف وقت انتظار 32-vCPU أكثر مما وفّر)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ وترجع forks إلى `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ وترجع forks إلى `macos-26`                                                                                                                                                                                                                     |

## ميزانية تسجيل المشغّلات

تبلغ حاوية تسجيل مشغّلات GitHub الحالية في OpenClaw ‏10,000 تسجيل مشغّل ذاتي الاستضافة لكل 5 دقائق في `ghx api rate_limit`. أعد فحص `actions_runner_registration` قبل كل تمريرة ضبط لأن GitHub قد يغيّر هذه الحاوية. يُشارك هذا الحد بين جميع تسجيلات مشغّلات Blacksmith في منظمة `openclaw`، لذلك فإن إضافة تثبيت Blacksmith آخر لا تضيف حاوية جديدة.

تعامل مع تسميات Blacksmith كمورد نادر للتحكم في الاندفاع. ينبغي أن تبقى المهام التي تقتصر على التوجيه أو الإشعار أو التلخيص أو اختيار الشظايا أو تشغيل فحوصات CodeQL قصيرة على مشغّلات GitHub المستضافة ما لم تكن لديها احتياجات خاصة بـ Blacksmith ومقاسة. يجب أن تعرض أي مصفوفة Blacksmith جديدة، أو `max-parallel` أكبر، أو سير عمل عالي التكرار، عدد التسجيلات في أسوأ الحالات وأن تبقي الهدف على مستوى المنظمة دون نحو 60% من الحاوية الحية. مع حاوية 10,000 تسجيل الحالية، يعني ذلك هدف تشغيل يبلغ 6,000 تسجيل، مع ترك هامش للمستودعات المتزامنة وإعادات المحاولة وتداخل الاندفاع.

تحافظ CI الخاصة بالمستودع القانوني على Blacksmith كمسار المشغّل الافتراضي لعمليات الدفع وطلبات السحب العادية. تستخدم عمليات `workflow_dispatch` وتشغيلات المستودعات غير القانونية مشغّلات GitHub المستضافة، لكن التشغيلات القانونية العادية لا تفحص حالياً صحة طابور Blacksmith ولا ترجع تلقائياً إلى تسميات GitHub المستضافة عندما يكون Blacksmith غير متاح.

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

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة ومؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريوهات.

يثبّت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل CPU/heap/trace لنقاط سخونة بدء التشغيل وGateway ودورة الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، تُتخطى عند عدم توفر `OPENAI_API_KEY`.

يشغّل مسار mock-provider أيضًا مجسات مصدر أصلية في OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية وhook و50 Plugin؛ وRSS لاستيراد Plugin المضمنة، وحلقات ترحيب `channel-chat-baseline` متكررة باستخدام OpenAI وهمي، وأوامر بدء CLI ضد Gateway الذي تم إقلاعه، ومجس أداء دخان حالة SQLite. عند توفر تقرير مصدر mock-provider المنشور السابق للمرجع المختبَر، يقارن ملخص المصدر قيم RSS وheap الحالية مع ذلك الخط الأساس ويضع علامة `watch` على الزيادات الكبيرة في RSS. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار artifacts إلى GitHub. عند تهيئة `CLAWGRIT_REPORTS_TOKEN`، يثبّت سير العمل أيضًا `report.json` و`report.md` والحزم و`index.md` وartifacts مجسات المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع لـ"تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات Plugin/الحزم/الثابت/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لاختبار تثبيت سريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة تقييم النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تتضمن الملفات التعريفية المستقرة والكاملة دائمًا تغطية شاملة live/E2E وDocker لمسار الإصدار؛ ويمكن للملف التعريفي beta الاشتراك عبر `run_release_soak=true`. يعمل Telegram E2E القانوني للحزمة داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل مستطلعًا حيًا مكررًا. بعد النشر، مرّر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار وPackage Acceptance وDocker وعبر أنظمة التشغيل وTelegram دون إعادة البناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة الحية لـ Codex Plugin الحالة المحددة نفسها افتراضيًا: يشتق `release_package_spec=openclaw@<tag>` المنشور `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تقوم تشغيلات SHA/artifact بحزم `extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحةً لمصادر Plugin مخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) لمعرفة
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، وartifacts،
ومقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُحدث تغييرات. شغّله
من `release/YYYY.M.PATCH` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويشغّل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغّل
`Plugin ClawHub Release` لنفس SHA الإصدار، وبعد ذلك فقط يشغّل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب النشر المستقر أيضًا
`windows_node_tag` مطابقًا تمامًا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتاته x64/ARM64 بإدخال `windows_node_installer_digests`
المعتمد للمرشح قبل أي ابن نشر، ثم يرقّي ويتحقق من ملخصات المثبتات المثبتة نفسها
إضافةً إلى أصل companion الدقيق وعقد checksum قبل نشر مسودة إصدار GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعًا أو وسومًا، لا SHA خامة للالتزامات. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويشغّل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل ابن يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل المتحقق الجامع أيضًا إذا شُغّل أي سير عمل ابن عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/provider الممرر إلى فحوصات الإصدار. تعتمد
سير عمل الإصدار اليدوية افتراضيًا على `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة provider/media الاستشارية الواسعة. تشغّل فحوصات الإصدار
المستقرة والكاملة دائمًا تغطية soak الشاملة live/E2E وDocker لمسار الإصدار؛
ويمكن للملف التعريفي beta الاشتراك عبر `run_release_soak=true`.

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة provider/backend المستقرة.
- يشغّل `full` مصفوفة provider/media الاستشارية الواسعة.

يسجل الجامع معرّفات تشغيل الأبناء التي تم تشغيلها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وأصبح أخضر، فأعد تشغيل مهمة المتحقق الأب فقط لتحديث نتيجة الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`plugin-prerelease` لابن prerelease الخاص بالـ Plugin فقط، و`release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الجامع. يُبقي ذلك إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثل `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية باستثناء بوابة تغطية أدوات وقت التشغيل القياسية، التي تحظر عندما تنحرف أدوات OpenClaw الديناميكية المطلوبة أو تختفي من ملخص الطبقة القياسية.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى tarball باسم `release-package-under-test`، ثم يمرر ذلك artifact إلى فحوصات cross-OS وPackage Acceptance، إضافةً إلى سير عمل Docker لمسار الإصدار live/E2E عند تشغيل تغطية soak. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام أبناء. بالنسبة إلى مسار Codex npm-plugin الحي، تمرر فحوصات الإصدار إما مواصفة Plugin منشورة مطابقة مشتقة من `release_package_spec`، أو تمرر `codex_plugin_spec` الذي يوفره المشغل، أو تترك الإدخال فارغًا كي يحزم سكربت Docker Plugin الخاص بـ Codex من checkout المحدد.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل الجامع الأقدم. يلغي مراقب الأب أي سير عمل ابن سبق أن شغّله
عند إلغاء الأب، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل فحص إصدار قديم
مدته ساعتان. تحافظ عمليات التحقق من فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على
`cancel-in-progress: false`.

## شظايا Live وE2E

يحافظ ابن release live/E2E على تغطية أصلية واسعة عبر `pnpm test:live`، لكنه يشغّلها كشظايا مسماة من خلال `scripts/test-live-shard.mjs` بدلًا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المرشحة حسب provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شظايا وسائط audio/video مقسمة وشظايا music مرشحة حسب provider

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات provider الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الشظايا التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادة التشغيل اليدوية لمرة واحدة.

تعمل شظايا الوسائط الحية الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبّت تلك الصورة مسبقًا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ مجموعات الاختبار الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم شرائح النماذج/الخلفيات الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت محدد. يبني مسار عمل الإصدار الحي هذه الصورة ويدفعها مرة واحدة، ثم تعمل شرائح نموذج Docker الحي، وGateway المقسّم حسب المزوّد، وخلفية CLI، وربط ACP، وحاضنة Codex باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شرائح Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة مسار العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت هذه الشرائح بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مكوّن بشكل خاطئ وسيهدر وقتا فعليا على عمليات بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف هذا عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من ملف tarball واحد عبر حاضنة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. تفحص `resolve_package`‏ `workflow_ref`، وتحل مرشح حزمة واحدا، وتكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، وتكتب `.artifacts/docker-e2e-package/package-candidate.json`، وترفع كليهما كأثر `package-under-test`، وتطبع المصدر، ومرجع مسار العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. تستدعي `docker_acceptance`‏ `openclaw-live-and-e2e-checks-reusable.yml` باستخدام `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل مسار العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد ملف tarball، ويحضر صور Docker لملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة مقابل تلك الحزمة بدلا من حزم checkout مسار العمل. عندما يختار ملف تعريفي عدة `docker_lanes` مستهدفة، يحضر مسار العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة ومتوازية ذات آثار فريدة.
3. تستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. تعمل عندما لا يكون `telegram_mode` هو `none` وتثبت أثر `package-under-test` نفسه عندما يحل قبول الحزمة واحدا؛ ويمكن لتشغيل Telegram المستقل أن يظل يثبت مواصفة npm منشورة.
4. تفشل `summary` مسار العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعا أو وسما أو SHA تثبيت كاملا موثوقا في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التثبيت المحدد قابل للوصول من تاريخ فرع المستودع أو وسم إصدار، ويثبت الاعتماديات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عاما عبر HTTPS؛ ويكون `package_sha256` مطلوبا. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو عناوين IP الخاصة/الداخلية/ذات الاستخدام الخاص أو المحلولة، وعمليات إعادة التوجيه خارج سياسة الأمان العامة نفسها.
- ينزّل `source=trusted-url` ملف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ ويكون `package_sha256` و`trusted_source_id` مطلوبين. استخدم هذا فقط لمرايا المؤسسات أو مستودعات الحزم الخاصة المملوكة للمشرفين التي تحتاج إلى مضيفين، أو منافذ، أو بادئات مسارات، أو مضيفي إعادة توجيه، أو حل شبكة خاصة مكوّن. إذا أعلنت السياسة مصادقة bearer، يستخدم مسار العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ وتظل بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزّل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ يكون `package_sha256` اختياريا لكنه ينبغي توفيره للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو رمز مسار العمل/الحاضنة الموثوق الذي يشغّل الاختبار. `package_ref` هو تثبيت المصدر الذي يجري حزمه عند `source=ref`. يتيح هذا لحاضنة الاختبار الحالية التحقق من تثبيتات مصادر موثوقة أقدم دون تشغيل منطق مسار عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin دون اتصال بحيث لا يكون التحقق من الحزمة المنشورة مشروطا بتوفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

للسياسة المخصصة لاختبار التحديث وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة باستخدام `source=artifact`، وأثر حزمة الإصدار المحضرة، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يحافظ هذا على إثبات ترحيل الحزمة، والتحديث، وتثبيت ClawHub Skills الحي، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المكوّن، وPlugin دون اتصال، وتحديث Plugin، وTelegram على ملف tarball الحزمة المحلول نفسه. عيّن `release_package_spec` في Full Release Validation أو OpenClaw Release Checks بعد نشر beta لتشغيل المصفوفة نفسها مقابل حزمة npm المشحونة دون إعادة بناء؛ وعيّن `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي سلوك الإعداد الأولي، والمثبت، والمنصة الخاص بكل نظام تشغيل؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker‏ `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة في كل تشغيل ضمن مسار الإصدار الحاجب. في قبول الحزمة، يكون ملف tarball المحلول `package-under-test` هو المرشح دائما، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full`‏ `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسيع عبر أحدث أربعة إصدارات npm مستقرة بالإضافة إلى إصدارات حدود توافق Plugin المثبتة وتجهيزات على شكل مشكلات لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المكوّنة، ومسارات سجلات tilde، وجذور اعتماديات Plugin القديمة. تُقسّم اختيارات published-upgrade survivor متعددة الخطوط الأساسية حسب خط الأساس إلى مهام تشغيل Docker مستهدفة منفصلة. يستخدم مسار العمل المنفصل `Update Migration` مسار Docker‏ `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديث المنشور بشكل شامل، وليس اتساع Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو الاحتفاظ بمسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يكوّن المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مضمّنة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows المعبأة والمثبت الجديد أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز تحكم المتصفح من مسار Windows مطلق خام. يستخدم اختبار دخان دورة وكيل OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيا عند تعيينه، وإلا يستخدم `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

يملك قبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة مسبقا. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تكشف الحزمة ذلك العلم؛
- قد يشذب `update-channel-switch`‏ `patchedDependencies` الخاصة بـ pnpm المفقودة من تجهيز git الزائف المشتق من ملف tarball، وقد يسجل `update.channel` المستمر المفقود؛
- قد تقرأ اختبارات دخان Plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التكوين مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات ختم بيانات تعريف البناء المحلي التي شُحنت مسبقا. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ بملخص `resolve_package` لتأكيد مصدر الحزمة، والإصدار، وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثاره في Docker: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## دخان التثبيت

يعيد مسار عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** طلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزم/بيانات Plugin المضمّنة، أو أسطح Plugin SDK/Plugin/القناة/Gateway الأساسية التي تمرّنها مهام اختبار Docker السريع. لا تحجز تغييرات Plugin المضمّنة الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط عمّال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل اختبار CLI السريع لحذف مساحات العمل المشتركة للوكلاء، ويشغّل اختبار e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء إضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود للـ Plugin المضمّنة ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تحديد تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت حزمة QR وDocker/التحديث للمثبّت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات إصدار workflow-call، وطلبات السحب التي تلمس فعليًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يحضّر install-smoke أو يعيد استخدام صورة اختبار سريع GHCR Dockerfile جذرية واحدة للـ target-SHA، ثم يشغّل تثبيت حزمة QR، واختبارات Dockerfile/Gateway الجذرية السريعة، واختبارات المثبّت/التحديث السريعة، وDocker E2E السريع للـ Plugin المضمّنة كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف اختبارات الصورة الجذرية السريعة.

لا تفرض عمليات الدفع إلى `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يحتفظ workflow باختبار Docker السريع ويترك اختبار التثبيت السريع الكامل للتحقق الليلي أو تحقق الإصدار.

اختبار موفّر صورة تثبيت Bun العام البطيء مضبوط بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن workflow فحوصات الإصدار، ويمكن لعمليات تشغيل `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب وعمليات الدفع إلى `main` لا تفعل ذلك. لا يزال CI العادي لطلبات السحب يشغّل مسار انحدار مشغّل Bun السريع للتغييرات المتعلقة بـ Node. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

ينشئ `pnpm test:docker:all` مسبقًا صورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت الأرشيف نفسه في `/app` لمسارات الوظائف العادية.

تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### خيارات الضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات المجموعة الرئيسية للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات مجموعة الذيل الحساسة للموفّر.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا يقيّد الموفّرون السرعة.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصل بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم وجود فاصل.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيلية محددة حدودًا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معيّن   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معيّن   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز اختبار التنظيف السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعّال أن يبدأ مع ذلك من مجموعة فارغة، ثم يعمل وحده حتى يحرر السعة. تفحص الاختبارات التمهيدية الإجمالية المحلية Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتستبقي توقيتات المسارات للترتيب من الأطول إلى الأقصر، وتتوقف افتراضيًا عن جدولة مسارات مجمّعة جديدة بعد أول فشل.

### workflow حي/E2E قابل لإعادة الاستخدام

يسأل workflow الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر حزمة من التشغيل الحالي، أو ينزّل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من جرد الأرشيف؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة Docker layer cache في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. يعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعًا تدفق registry/cache العالق بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تشغّل تغطية Docker للإصدار مهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفّذ مسارات متعددة عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار حزمة Plugin Codex الحي، الذي يثبّت حزمة OpenClaw المرشحة، ويثبّت Plugin Codex من `codex_plugin_spec` أو أرشيف من المرجع نفسه مع موافقة صريحة على تثبيت Codex CLI، ويشغّل الفحص التمهيدي لـ Codex CLI، ثم يشغّل عدة دورات وكيل OpenClaw في الجلسة نفسها مقابل OpenAI. تظل `plugins-runtime-core`، و`plugins-runtime`، و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار لمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبت الموفّر.

يُضم OpenWebUI إلى `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء `openwebui` مستقل فقط لعمليات التشغيل الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل npm الشبكي العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وخطة المجدول بصيغة JSON، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في workflow المسارات المحددة مقابل الصور المحضّرة بدلًا من مهام الأجزاء، ما يبقي تصحيح أخطاء المسار الفاشل محدودًا في مهمة Docker واحدة موجهة ويحضّر أو ينزّل أو يعيد استخدام أثر الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker حيًا، تبني المهمة الموجهة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر GitHub لإعادة التشغيل المولدة لكل مسار `package_artifact_run_id`، و`package_artifact_name`، ومدخلات الصور المحضّرة عندما تكون تلك القيم موجودة، حتى يتمكن المسار الفاشل من إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل workflow الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي للـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو workflow منفصل يتم تشغيله بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تبقي طلبات السحب العادية، وعمليات الدفع إلى `main`، وعمليات تشغيل CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمّال إضافات؛ تشغّل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي إعداد Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات Plugin الكثيفة الاستيراد مهام CI إضافية. يجمّع مسار Docker للإصدار التمهيدي الخاص بالإصدار مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام مدتها دقيقة إلى ثلاث دقائق. يرفع workflow أيضًا أثرًا معلوماتيًا باسم `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ نتائج inspector هي مدخلات فرز ولا تغيّر بوابة `Plugin Prerelease` الحاجزة.

## QA Lab

لدى QA Lab مسارات CI مخصصة خارج workflow الرئيسي ذي النطاق الذكي. تكافؤ الوكلاء متداخل تحت أحزمة QA والإصدار الواسعة، وليس workflow مستقلًا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما يجب أن يرافق التكافؤ تشغيل تحقق واسعًا.

- يعمل workflow `QA-Lab - All Lanes` ليليًا على `main` وعند التشغيل اليدوي؛ يوزّع مسار تكافؤ المحاكاة، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مساري النقل الحيين Matrix وTelegram مع موفّر المحاكاة الحتمي ونماذج مؤهلة بالمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يعزل عقد القناة عن زمن كمون النموذج الحي وبدء Plugin الموفّر العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ تغطى اتصالية الموفّر بواسطة مجموعات النموذج الحي والموفّر الأصلي وموفّر Docker المنفصلة.

يستخدم Matrix الخيار `--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI الذي تم checkout له. يظل افتراضي CLI ومدخل workflow اليدوي `all`؛ تشغيل `matrix_profile=all` اليدوي يقسّم دائمًا تغطية Matrix الكاملة إلى مهام `transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ تشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى طلبات السحب العادية، اتبع دليل CI/الفحص ذي النطاق بدلًا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

workflow `CodeQL` هو عمدًا ماسح أمان ضيق للمرور الأول، وليس مسحًا كاملًا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود workflow الخاص بـ Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستعلامات أمان عالية الثقة مرشحة إلى `security-severity` عالية/حرجة.

تبقى حراسة طلب السحب خفيفة: لا تبدأ إلا للتغييرات تحت `.github/actions`، أو `.github/codeql`، أو `.github/workflows`، أو `packages`، أو `scripts`، أو `src`، أو مسارات وقت تشغيل Plugin المضمّنة المالكة للعملية، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل workflow المجدول. يظل CodeQL الخاص بـ Android وmacOS خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                            | السطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، والأسرار، وsandbox، وCron، وخط أساس Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية بالإضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وSSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/process-exec-boundary`     | الصدفة المحلية، ومساعدات إنشاء العمليات، وأوقات تشغيل Plugins المضمّنة المالكة للعمليات الفرعية، وغراء سكربتات سير العمل                             |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة الخاصة بتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK |

### شظايا الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، وتصفّي نتائج بناء التبعيات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. أُبقيت خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي شظية غير أمنية مقابلة. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية وبشدة الخطأ على أسطح ضيقة عالية القيمة على مشغّلات Linux المستضافة من GitHub كي لا تستهلك فحوص الجودة ميزانية تسجيل مشغّلات Blacksmith. حارس طلب السحب فيها أصغر عمدًا من الملف المجدول: طلبات السحب غير المسودة فقط تشغّل شظايا `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوزيع الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود Auth/الأسرار/sandbox/الأمان، ووقت تشغيل القنوات الأساسية وPlugin القناة المضمّن، وبروتوكول Gateway/طريقة الخادم، وغراء وقت تشغيل الذاكرة/SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسات/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل ردود Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغّل كل شظايا جودة طلبات السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي خطافات تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان Auth، والأسرار، وsandbox، وCron، وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال/الإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القنوات الأساسية وPlugin القناة المضمّن                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوزيع النماذج/المزوّدين، وتوزيع الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات مراقبة العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسة |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزيع الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الردود، وخيارات رد القنوات، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، وAuth واكتشاف المزوّدين، وتسجيل وقت تشغيل المزوّدين، وافتراضات/كتالوجات المزوّدين، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل جلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود نقطة دخول المحمّل، والسجل، والسطح العام، وPlugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان كي يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. ينبغي إعادة إضافة توسعة CodeQL الخاصة بـ Swift، وPython، وPlugins المضمّنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الضيقة مستقرة في زمن التشغيل والإشارة.

## مسارات عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت حديثًا. لا يملك جدولًا بحتًا: يمكن لتشغيل CI ناجح نتيجة دفع غير آلي إلى `main` أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أُنشئ خلال الساعة الماضية. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. لا يملك جدولًا بحتًا: يمكن لتشغيل CI ناجح نتيجة دفع غير آلي إلى `main` أن يطلقه، لكنه يتخطى إذا كان استدعاء آخر لتشغيل سير العمل قد عمل أو قيد العمل في ذلك اليوم بتوقيت UTC. التشغيل اليدوي يتجاوز بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعًا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبار صغيرة فقط مع الحفاظ على التغطية بدلًا من عمليات إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمع زمن الساعة الفعلي لكل إعداد والحد الأقصى لـ RSS على Linux وmacOS، بحيث تُظهر مقارنة قبل/بعد فروقات ذاكرة الاختبار بجانب فروقات المدة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ وتتخطى الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف من GitHub كي يستطيع إجراء Codex الحفاظ على وضعية أمان drop-sudo نفسها مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف المكررات بعد الهبوط. افتراضيًا يعمل كتجربة جافة ولا يغلق إلا طلبات السحب المدرجة صراحة عندما يكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدموج وأن كل مكرر لديه إما مشكلة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتُنفّذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغّل فحص أنواع الإنتاج الأساسي واختبارات الأساسي بالإضافة إلى lint/guards الأساسي؛
- تغييرات الاختبار فقط في الأساسي تشغّل فقط فحص أنواع اختبارات الأساسي بالإضافة إلى lint الأساسي؛
- تغييرات إنتاج الإضافات تشغّل فحص أنواع إنتاج الإضافات واختبارات الإضافات بالإضافة إلى lint الإضافات؛
- تغييرات الاختبار فقط في الإضافات تشغّل فحص أنواع اختبارات الإضافات بالإضافة إلى lint الإضافات؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على تلك العقود الأساسية (تبقى عمليات تمشيط إضافات Vitest عمل اختبار صريحًا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار فقط تشغّل فحوصًا مستهدفة للإصدار/الإعداد/تبعيات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبار المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء ومعتمدي مخطط الاستيراد. إعداد تسليم غرف المجموعات المشتركة هو أحد الخرائط الصريحة: التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجه نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية بالإضافة إلى انحدارات تسليم Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا بما يكفي في الحزمة بحيث لا تكون المجموعة الرخيصة المرسومة وكيلًا موثوقًا.

## تحقق Testbox

Crabbox هو مغلّف الصناديق البعيدة المملوك للمستودع لإثباتات Linux الخاصة بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص أوسع من حلقة تعديل محلية، أو عندما تهم
مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات حزم،
أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. الواجهة الخلفية العادية في OpenClaw هي
`blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة مسارًا احتياطيًا عند انقطاعات Blacksmith
أو مشكلات الحصة أو الاختبار الصريح على السعة المملوكة.

تشغّل عمليات Blacksmith المدعومة من Crabbox عملية تهيئة دافئة، ومطالبة، ومزامنة، وتشغيل، وتقرير، وتنظيف
لـ Testboxes أحادية الاستخدام. يفشل فحص سلامة المزامنة المدمج بسرعة عندما تختفي
ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 حذف متتبع. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI محليًا يبقى في
مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. عيّن
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص المغلّف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض مغلّف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن `blacksmith-testbox`. مرّر المزوّد صراحة حتى لو كانت `.crabbox.yaml` تحتوي على افتراضات السحابة المملوكة. في أشجار عمل Codex أو عمليات checkout المرتبطة/المتفرقة، تجنب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يوفق الاعتماديات قبل بدء Crabbox؛ استدع مغلّف node مباشرة بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب العمليات المدعومة من Blacksmith إصدار Crabbox 0.22.0 أو أحدث كي يحصل المغلّف على سلوك مزامنة Testbox والصف والتنظيف الحالي. عند استخدام checkout شقيق، أعد بناء الملف الثنائي المحلي المتجاهل قبل أعمال التوقيت أو الإثبات:

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
  "corepack pnpm test"
```

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId`
و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. بالنسبة إلى عمليات
Blacksmith Testbox المفوّضة، يكون رمز خروج مغلّف Crabbox وملخص JSON هما
نتيجة الأمر. يملك تشغيل GitHub Actions المرتبط التهيئة وkeepalive؛ وقد
ينتهي بالحالة `cancelled` عندما يتم إيقاف Testbox خارجيًا بعد أن يكون أمر SSH
قد عاد بالفعل. تعامل مع ذلك كأثر تنظيف/حالة ما لم يكن
`exitCode` الخاص بالمغلّف غير صفري أو تُظهر مخرجات الأمر اختبارًا فاشلًا.
ينبغي أن توقف عمليات Crabbox أحادية الاستخدام المدعومة من Blacksmith الـ Testbox تلقائيًا؛
إذا قوطع تشغيل أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط
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
Blacksmith مباشرة فقط للتشخيصات مثل `list` و`status` والتنظيف. أصلح
مسار Crabbox قبل اعتبار تشغيل Blacksmith المباشر إثباتًا للمشرفين.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن
عمليات التهيئة الدافئة الجديدة تبقى `queued` بلا IP أو رابط تشغيل Actions بعد دقيقتين،
فتعامل مع ذلك كضغط على مزوّد Blacksmith أو الصف أو الفوترة أو حدود المؤسسة. أوقف
المعرّفات المصطفة التي أنشأتها، وتجنب بدء المزيد من Testboxes، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة Blacksmith،
والفوترة، وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو مقيّدًا بالحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحة:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU، وهو أسهل طريقة لبلوغ حصة EC2 Spot أو On-Demand Standard الإقليمية. تضبط `.crabbox.yaml` المملوكة للمستودع الافتراضات على `standard`، ومناطق سعة متعددة، و`capacity.hints: true` كي تطبع إيجارات AWS التي يتوسطها الوسيط المنطقة/السوق المختارة، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئة عالية الضغط. استخدم `fast` للفحوص الواسعة الأثقل، و`large` فقط بعد أن لا تكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المعتمدة على CPU مثل المجموعة الكاملة أو مصفوفات Docker لكل الـ Plugin، أو تحقق الإصدار/الحظر الصريح، أو تحليل الأداء عالي الأنوية. لا تستخدم `beast` لـ `pnpm check:changed`، أو الاختبارات المركزة، أو عمل التوثيق فقط، أو lint/typecheck العادي، أو عمليات إعادة إنتاج E2E الصغيرة، أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط تقلب سوق Spot بالإشارة.

تملك `.crabbox.yaml` افتراضات المزوّد والمزامنة وتهيئة GitHub Actions للمسارات السحابية المملوكة. تستثني `.git` المحلي كي يحافظ checkout المهيأ عبر Actions على بيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرف، وتستثني آثار التشغيل/البناء المحلية التي ينبغي ألا تُنقل أبدًا. تملك `.github/workflows/crabbox-hydrate.yml` عملية checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتمرير البيئة غير السرية لأوامر `crabbox run --id <cbx_id>` في السحابة المملوكة.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

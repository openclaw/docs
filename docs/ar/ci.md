---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح فحصًا فاشلًا في GitHub Actions
    - أنت تنسّق تشغيل تحقق إصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: رسم مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-07-02T14:03:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

تعمل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تمر عمليات الدفع
القانونية إلى `main` أولا عبر نافذة قبول مدتها 90 ثانية على المشغل المستضاف.
تلغي مجموعة التزامن الحالية `CI` ذلك التشغيل المنتظر عند وصول تنفيذ أحدث،
لذلك لا تسجل عمليات الدمج المتتابعة كل واحدة منها مصفوفة Blacksmith كاملة.
تتجاوز طلبات السحب وعمليات التشغيل اليدوية فترة الانتظار. بعد ذلك تصنف مهمة
`preflight` الفرق وتوقف المسارات المكلفة عندما تكون المناطق غير ذات الصلة
هي وحدها التي تغيرت. تتجاوز عمليات `workflow_dispatch` اليدوية عمدا تحديد
النطاق الذكي وتوسع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع.
تبقى مسارات Android اختيارية عبر `include_android`. تعيش تغطية Plugin الخاصة
بالإصدارات فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل
وتعمل فقط من [`Full Release Validation`](#full-release-validation) أو من تشغيل
يدوي صريح.

## نظرة عامة على المسار

| المهمة                             | الغرض                                                                                                      | متى تعمل                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI                        | دائما عند عمليات الدفع وطلبات السحب غير المسودة     |
| `runner-admission`                 | إزالة الارتداد لمدة 90 ثانية على المشغل المستضاف لعمليات الدفع القانونية إلى `main` قبل تسجيل عمل Blacksmith | كل تشغيل CI؛ ينام فقط عند عمليات الدفع القانونية إلى `main` |
| `security-fast`                    | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق ملف القفل للإنتاج                   | دائما عند عمليات الدفع وطلبات السحب غير المسودة     |
| `check-dependencies`               | مرور Knip لاعتماديات الإنتاج فقط بالإضافة إلى حارس قائمة السماح للملفات غير المستخدمة                    | تغييرات ذات صلة بـ Node                              |
| `build-artifacts`                  | بناء `dist/`، وواجهة Control UI، وفحوصات smoke للـ CLI المبني، وفحوصات عناصر البناء المضمنة، وعناصر قابلة لإعادة الاستخدام | تغييرات ذات صلة بـ Node                              |
| `checks-fast-core`                 | مسارات صحة Linux السريعة مثل المضمن، والبروتوكول، وQA Smoke CI، وفحوصات توجيه CI                         | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-plugins-*`  | فحصا عقود Plugin مقسمان إلى شظايا                                                                        | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-channels-*` | فحصا عقود القنوات مقسمان إلى شظايا                                                                       | تغييرات ذات صلة بـ Node                              |
| `checks-node-core-*`               | شظايا اختبارات Node الأساسية، مع استثناء مسارات القنوات، والمضمن، والعقود، والامتدادات                  | تغييرات ذات صلة بـ Node                              |
| `check-*`                          | مكافئ البوابة المحلية الرئيسية المقسم إلى شظايا: أنواع الإنتاج، وlint، والحراس، وأنواع الاختبار، وsmoke الصارم | تغييرات ذات صلة بـ Node                              |
| `check-additional-*`               | البنية، وانحراف الحدود/المطالبات المقسم، وحراس الامتدادات، وحدود الحزم، وطوبولوجيا وقت التشغيل          | تغييرات ذات صلة بـ Node                              |
| `checks-node-compat-node22`        | بناء توافق Node 22 ومسار smoke                                                                            | تشغيل CI يدوي للإصدارات                              |
| `check-docs`                       | تنسيق الوثائق، وlint، وفحوصات الروابط المعطلة                                                            | عند تغير الوثائق                                     |
| `skills-python`                    | Ruff + pytest للـ Skills المدعومة بـ Python                                                               | تغييرات ذات صلة بـ Skills الخاصة بـ Python          |
| `checks-windows`                   | اختبارات العمليات/المسارات الخاصة بـ Windows بالإضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة | تغييرات ذات صلة بـ Windows                           |
| `macos-node`                       | مسار اختبار TypeScript على macOS باستخدام عناصر البناء المشتركة                                           | تغييرات ذات صلة بـ macOS                             |
| `macos-swift`                      | Swift lint، والبناء، والاختبارات لتطبيق macOS                                                             | تغييرات ذات صلة بـ macOS                             |
| `ios-build`                        | توليد مشروع Xcode بالإضافة إلى بناء محاكي تطبيق iOS                                                       | تطبيق iOS، أو عدة التطبيق المشتركة، أو تغييرات Swabble |
| `android`                          | اختبارات وحدات Android لكلا النكهتين بالإضافة إلى بناء debug APK واحد                                     | تغييرات ذات صلة بـ Android                           |
| `test-performance-agent`           | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                        | نجاح CI الرئيسي أو تشغيل يدوي                        |
| `openclaw-performance`             | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات الموفر الوهمي، والملف الشخصي العميق، وGPT 5.5 الحية | مجدول وتشغيل يدوي                                    |

## ترتيب الفشل السريع

1. تنتظر `runner-admission` فقط لعمليات الدفع القانونية إلى `main`؛ يلغي دفع أحدث التشغيل قبل تسجيل Blacksmith.
2. تقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` هو خطوات داخل هذه المهمة، وليس مهام مستقلة.
3. تفشل `security-fast`، و`check-*`، و`check-additional-*`، و`check-docs`، و`skills-python` بسرعة من دون انتظار مهام العناصر الأثقل ومصفوفة المنصات.
4. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد جاهزية البناء المشترك.
5. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core`، و`checks-fast-contracts-plugins-*`، و`checks-fast-contracts-channels-*`، و`checks-node-core-*`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`ios-build`، و`android`.

قد يعلّم GitHub المهام التي حل محلها تشغيل أحدث على أنها `cancelled` عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، وتبلغ `build-artifacts` عن فشل القناة المضمنة، وحدود دعم النواة، وgateway-watch مباشرة بدلا من وضع مهام تحقق صغيرة في الطابور. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) حتى لا يتمكن تشغيل عالق من جهة GitHub في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل الحزمة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

استخدم `pnpm ci:timings`، أو `pnpm ci:timings:recent`، أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص وقت الجدار، ووقت الطابور، وأبطأ المهام، والإخفاقات، وحاجز توسع `pnpm-store-warmup` من GitHub Actions. ترفع CI أيضا ملخص التشغيل نفسه كعنصر `ci-timings-summary`. لتوقيت البناء، تحقق من خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` النص `[build-all] phase timings:` ويتضمن `ui:build`؛ كما ترفع المهمة عنصر `startup-memory`.

بالنسبة لتشغيلات طلبات السحب، تشغل مهمة ملخص التوقيت الطرفية المساعد من مراجعة الأساس الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. يبقي ذلك الاستعلام ذي الرمز خارج الكود المتحكم به من الفرع مع الاستمرار في تلخيص تشغيل CI الحالي لطلب السحب.

## سياق طلب السحب والأدلة

تشغل طلبات سحب المساهمين الخارجيين بوابة سياق طلب السحب والأدلة من
`.github/workflows/real-behavior-proof.yml`. يتحقق سير العمل من تنفيذ الأساس
الموثوق ويقيّم متن طلب السحب فقط؛ ولا ينفذ كودا من فرع المساهم.

تنطبق البوابة على مؤلفي طلبات السحب الذين ليسوا مالكي المستودع، أو أعضاء،
أو متعاونين، أو بوتات. تنجح عندما يحتوي متن طلب السحب على قسمي
`What Problem This Solves` و`Evidence` مكتوبين من المؤلف. يمكن أن يكون الدليل
اختبارا مركزا، أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو مخرجات طرفية، أو
ملاحظة حية، أو سجلا منقحا، أو رابط عنصر. يوفر المتن القصد والتحقق المفيد؛
ويفحص المراجعون الكود والاختبارات وCI لتقييم الصحة.

عندما يفشل الفحص، حدّث متن طلب السحب بدلا من دفع تنفيذ كود آخر.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق تغيرت.

- تتحقق **تعديلات سير عمل CI** من رسم CI الخاص بـ Node بالإضافة إلى lint لسير العمل، لكنها لا تفرض وحدها بناءات Windows أو iOS أو Android أو macOS الأصلية؛ تبقى مسارات المنصات تلك محددة النطاق لتغييرات مصدر المنصة.
- يشغل **Workflow Sanity** أداة `actionlint`، و`zizmor` على كل ملفات YAML لسير العمل، وحارس استيفاء composite-action، وحارس علامات التعارض. كما تشغل مهمة `security-fast` المحددة بنطاق طلب السحب `zizmor` على ملفات سير العمل المتغيرة حتى تفشل اكتشافات أمان سير العمل مبكرا في رسم CI الرئيسي.
- يتم فحص **الوثائق عند عمليات الدفع إلى `main`** بواسطة سير عمل `Docs` المستقل باستخدام مرآة وثائق ClawHub نفسها التي تستخدمها CI، لذلك لا تضع عمليات دفع الكود+الوثائق المختلطة شظية CI `check-docs` أيضا في الطابور. لا تزال طلبات السحب وCI اليدوية تشغل `check-docs` من CI عند تغير الوثائق.
- تعمل **TUI PTY** في شظية Linux Node `checks-node-core-runtime-tui-pty` لتغييرات TUI. تشغل الشظية `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك تغطي كلا من مسار fixture الحتمي `TuiBackend` وsmoke الأبطأ `tui --local` الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- تستخدم **تعديلات توجيه CI فقط، وتعديلات fixture مختارة ورخيصة لاختبارات النواة، وتعديلات مساعد/توجيه اختبار عقود Plugin الضيقة** مسار بيان سريع خاصا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار عناصر البناء، وتوافق Node 22، وعقود القنوات، وشظايا النواة الكاملة، وشظايا Plugin المضمن، ومصفوفات الحراسة الإضافية عندما يكون التغيير محدودا بأسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- تحدد **فحوصات Windows Node** نطاقها إلى مغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغل npm/pnpm/UI، وإعداد مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير ذات الصلة، وPlugin، وinstall-smoke، والاختبار فقط على مسارات Linux Node.

تُقسّم أو تُوازَن أبطأ عائلات اختبارات Node بحيث تبقى كل مهمة صغيرة من دون الإفراط في حجز المشغلات: تعمل عقود Plugin وعقود القنوات كلٌ منها كجزأين موزونين مدعومين بـ Blacksmith مع الرجوع القياسي إلى مشغل GitHub، وتعمل مسارات core unit fast/support بشكل منفصل، وتُقسّم بنية core runtime التحتية بين state وprocess/config وshared وثلاثة أجزاء لنطاقات cron، ويعمل auto-reply كعمال متوازنين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسّم إعدادات gateway/server الوكيلة عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلًا من انتظار العناصر المبنية. بعد ذلك، يحزم CI العادي فقط أجزاء أنماط التضمين المعزولة للبنية التحتية في حزم حتمية لا تتجاوز 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج command/cron غير المعزولة أو agents-core ذات الحالة أو حزم gateway/server؛ وتبقى الحزم الثقيلة الثابتة على 8 vCPU بينما تستخدم المسارات المحزّمة والأقل وزنًا 4 vCPU. تستخدم طلبات السحب على المستودع الأساسي خطة قبول مضغوطة إضافية: تعمل مجموعات كل إعداد نفسها في عمليات فرعية معزولة داخل خطة Linux Node الحالية ذات 34 مهمة، لذلك لا يسجل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main` والتشغيلات اليدوية وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من المجمّع العام المشترك لاختبارات Plugin. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل عن جزء مفلتر. يُبقي `check-additional-*` أعمال تجميع/كناري حدود الحزم معًا ويفصل بنية طبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ وتُخطّط قائمة حراس الحدود إلى جزء كثيف الموجهات وجزء مدمج لبقية خطوط الحراسة، ويشغل كلٌ منها حراسًا مستقلين محددين بالتوازي ويطبع توقيت كل فحص. يعمل فحص انحراف لقطة موجه المسار السعيد المكلف في Codex كمهمة إضافية مستقلة لـ CI اليدوي وللتغييرات المؤثرة في الموجهات فقط، لذلك لا تنتظر تغييرات Node العادية غير ذات الصلة خلف توليد لقطات الموجهات البارد وتبقى أجزاء الحدود متوازنة بينما يظل انحراف الموجه مثبتًا بطلب السحب الذي سببه؛ وتتجاوز الراية نفسها توليد Vitest للقطات الموجهات داخل جزء حدود دعم core الخاص بالعناصر المبنية. تعمل مراقبة Gateway واختبارات القنوات وجزء حدود دعم core بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` مسبقًا.

بعد القبول، يسمح CI الأساسي على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات الأصغر fast/check؛ وتبقى Windows وAndroid عند اثنتين لأن مجموعات المشغلات تلك أضيق.

تُصدر خطة طلب السحب المضغوطة 18 مهمة Node للحزمة الحالية: تُجمّع مجموعات الإعدادات الكاملة في عمليات فرعية معزولة مع مهلة دفعة قدرها 120 دقيقة، بينما تشارك مجموعات أنماط التضمين ميزانية المهام المحدودة نفسها.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تحتوي نكهة الطرف الثالث على مجموعة مصادر أو بيان منفصل؛ وما زال مسار اختبار الوحدة الخاص بها يجمع النكهة مع رايات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف debug APK مكررة في كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (مرور Knip إنتاجي للتبعيات فقط مثبت على أحدث إصدار من Knip، مع تعطيل حد عمر الإصدار الأدنى في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مُراجع أو يترك إدخالًا قديمًا في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبارات الحية وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر الموجود في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المسائل وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المسائل؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. ويتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام ملاحظة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في موجّهه، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للتنفيذ أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديل المعتادة، وضجيج الروبوتات، وضوضاء Webhook المكررة، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعة وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادي لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المحزّمة، وأجزاء عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات الدخان للعناصر المبنية، وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وبناء iOS، وControl UI i18n. تعمل عمليات CI اليدوية المستقلة على Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستثنى فحوصات Plugin الثابتة قبل الإصدار، وجزء `agentic-plugins` الخاص بالإصدار فقط، والتمشيط الكامل لدفعات الإضافات، ومسارات Docker الخاصة بـ Plugin قبل الإصدار من CI. لا تعمل حزمة Docker قبل الإصدار إلا عندما يشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة بحيث لا تُلغى حزمة مرشح إصدار كاملة بسبب دفعة أو طلب سحب آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني مقابل فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغل                          | المهام                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | تشغيل CI اليدوي وبدائل المستودعات غير الأساسية، وفحوصات جودة CodeQL JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل الوثائق خارج CI، وتمهيد install-smoke حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، و`security-fast`، وأجزاء الإضافات الأقل وزنًا، و`checks-fast-core`، وأجزاء عقود Plugin والقنوات، ومعظم أجزاء Linux Node المحزّمة/الأقل وزنًا، و`check-guards`، و`check-prod-types`، و`check-test-types`، وأجزاء محددة من `check-additional-*`، و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | حزم Linux Node الثقيلة المحتفظ بها، وأجزاء `check-additional-*` كثيفة الحدود/الإضافات، و`android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، و`check-lint` (حساس بما يكفي للمعالج بحيث كلفت 8 vCPU أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلف وقت انتظار 32-vCPU أكثر مما وفر)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ وتعود الفروع إلى `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ وتعود الفروع إلى `macos-26`                                                                                                                                                                                                  |

## ميزانية تسجيل المشغلات

تبلغ حزمة تسجيل مشغلات GitHub الحالية في OpenClaw عن 10,000 تسجيل مشغل ذاتي الاستضافة لكل 5 دقائق في `ghx api rate_limit`. أعد فحص `actions_runner_registration` قبل كل جولة ضبط لأن GitHub يمكنه تغيير هذه الحزمة. يشترك في الحد جميع تسجيلات مشغلات Blacksmith في مؤسسة `openclaw`، لذلك لا تضيف إضافة تثبيت Blacksmith آخر حزمة جديدة.

تعامل مع تسميات Blacksmith كمورد نادر للتحكم في الاندفاع. يجب أن تبقى المهام التي تقتصر على التوجيه أو الإشعار أو التلخيص أو اختيار الأجزاء أو تشغيل فحوصات CodeQL قصيرة على مشغلات GitHub المستضافة ما لم تكن لديها احتياجات خاصة بـ Blacksmith ومقاسة. يجب أن تعرض أي مصفوفة Blacksmith جديدة أو `max-parallel` أكبر أو سير عمل عالي التكرار أسوأ عدد تسجيلات متوقع لها وأن تُبقي هدف مستوى المؤسسة أقل من نحو 60% من الحزمة الحية. مع حزمة التسجيل الحالية البالغة 10,000، يعني ذلك هدف تشغيل قدره 6,000 تسجيل، مع ترك هامش للمستودعات المتزامنة وإعادة المحاولة وتداخل الاندفاعات.

يحافظ CI للمستودع الأساسي على Blacksmith كمسار المشغل الافتراضي لعمليات الدفع وطلبات السحب العادية. تستخدم تشغيلات `workflow_dispatch` والمستودعات غير الأساسية مشغلات GitHub المستضافة، لكن التشغيلات الأساسية العادية لا تفحص حاليًا صحة طابور Blacksmith ولا تعود تلقائيًا إلى تسميات GitHub المستضافة عندما لا يكون Blacksmith متاحًا.

## المكافئات المحلية

```bash
pnpm changed:lanes                            # افحص مصنّف المسارات المتغيرة المحلي لـ origin/main...HEAD
pnpm check:changed                            # بوابة فحص محلية ذكية: فحص النوع/lint/الحراس المتغيرة حسب مسار الحدود
pnpm check                                    # بوابة محلية سريعة: prod tsgo + lint مجزأ + حراس سريعون متوازيون
pnpm check:test-types
pnpm check:timed                              # البوابة نفسها مع توقيتات لكل مرحلة
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # اختبارات vitest
pnpm test:changed                             # أهداف Vitest ذكية ورخيصة للتغييرات
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # تنسيق docs + lint + الروابط المعطلة
pnpm build                                    # ابنِ dist عندما تكون فحوصات CI artifacts/smoke مهمة
pnpm ios:build                                # أنشئ مشروع تطبيق iOS وابنه
pnpm ci:timings                               # لخّص أحدث تشغيل CI لدفع origin/main
pnpm ci:timings:recent                        # قارن تشغيلات CI الناجحة الحديثة على main
node scripts/ci-run-timings.mjs <run-id>      # لخّص زمن الجدار، وزمن الطابور، وأبطأ المهام
node scripts/ci-run-timings.mjs --latest-main # تجاهل ضجيج issue/comment واختر CI لدفع origin/main
node scripts/ci-run-timings.mjs --recent 10   # قارن تشغيلات CI الناجحة الحديثة على main
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

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة ومؤشرات الأحدث حسب المرجع المختبر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية ضد وقت تشغيل مبني محليًا مع مصادقة OpenAI-compatible زائفة وحتمية.
- `mock-deep-profile`: تحليل CPU/heap/trace لنقاط التشغيل الساخنة في بدء التشغيل، وGateway، ودوران الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا مجسات مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وRSS لاستيراد Plugin المجمّع، وحلقات ترحيب mock-OpenAI `channel-chat-baseline` المتكررة، وأوامر بدء تشغيل CLI ضد Gateway المشغّل، ومجس أداء smoke لحالة SQLite. عندما يكون تقرير مصدر mock-provider المنشور السابق متاحًا للمرجع المختبر، يقارن ملخص المصدر قيم RSS وheap الحالية مع ذلك الخط الأساسي ويضع علامة `watch` على الزيادات الكبيرة في RSS. يعيش ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ، يثبت سير العمل أيضًا `report.json` و`report.md` والحزم و`index.md` وartifacts مجسات المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات plugin/package/static/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لفحص install smoke، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة نقاط النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تتضمن ملفات stable وfull التعريفية دائمًا تغطية exhaustive live/E2E وDocker release-path soak؛ ويمكن لملف beta التعريفي الاشتراك باستخدام `run_release_soak=true`. يعمل Telegram E2E القانوني للحزمة داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل مستطلعًا حيًا مكررًا. بعد النشر، مرر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر release checks وPackage Acceptance وDocker وعبر أنظمة التشغيل وTelegram دون إعادة البناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة الحي لـ Codex plugin الحالة المحددة نفسها افتراضيًا: `release_package_spec=openclaw@<tag>` المنشور يستنتج `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تحزم تشغيلات SHA/artifact ‏`extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحةً لمصادر Plugin مخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للحصول على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، واختلافات الملفات التعريفية، وartifacts، و
معالجات إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي المُعدِّل. شغّله
من `release/YYYY.M.PATCH` أو `main` بعد وجود وسم الإصدار وبعد نجاح
فحص OpenClaw npm التمهيدي. يتحقق من `pnpm plugins:sync:check`،
ويشغّل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغّل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغّل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب النشر stable أيضًا
`windows_node_tag` دقيقًا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتاته x64/ARM64 مع إدخال
`windows_node_installer_digests` المعتمد للمرشح قبل أي publish child، ثم يروّج
ويتحقق من ملخصات المثبت المثبتة نفسها بالإضافة إلى أصل الرفيق الدقيق
وعقد checksum قبل نشر مسودة إصدار GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

لإثبات commit مثبت على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال سير عمل GitHub فروعا أو وسوما، وليست commit SHAs خاما. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل متحقق المظلة أيضا إذا شغل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في نطاق live/المزود الممرر إلى فحوصات الإصدار. تعتمد
سير عمل الإصدار اليدوية افتراضيا على `stable`؛ استخدم `full` فقط عندما
تريد عمدا مصفوفة المزود/الوسائط الاستشارية الواسعة. تشغل فحوصات الإصدار
المستقر والكامل دائما اختبار soak الشامل لمسار live/E2E وDocker؛
يمكن لملف beta تفعيله باستخدام `run_release_soak=true`.

- يبقي `minimum` أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة مزودي/خلفيات الاستقرار.
- يشغل `full` مصفوفة المزود/الوسائط الاستشارية الواسعة.

تسجل المظلة معرفات التشغيل الفرعية المرسلة، وتعيد مهمة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتضيف جداول أبطأ المهام لكل تشغيل فرعي. إذا أعيد تشغيل سير عمل فرعي وتحول إلى أخضر، فأعد تشغيل مهمة المتحقق الأب فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لطفل CI الكامل العادي فقط، و`plugin-prerelease` لطفل ما قبل إصدار Plugin فقط، و`release-checks` لكل أطفال الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. يحافظ هذا على إعادة تشغيل صندوق إصدار فاشل ضمن نطاق محدود بعد إصلاح موجه. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، على سبيل المثال `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية باستثناء بوابة تغطية أدوات runtime القياسية، التي تحظر عندما تنحرف أدوات OpenClaw الديناميكية المطلوبة أو تختفي من ملخص الفئة القياسية.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك الأثر إلى فحوصات cross-OS وPackage Acceptance، إضافة إلى سير عمل Docker لمسار إصدار live/E2E عندما تعمل تغطية soak. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تحزيم المرشح نفسه في عدة مهام فرعية. لمسار npm-plugin المباشر الخاص بـ Codex، تمرر فحوصات الإصدار إما مواصفة Plugin منشورة مطابقة مشتقة من `release_package_spec`، أو تمرر `codex_plugin_spec` المقدمة من المشغل، أو تترك الإدخال فارغا كي يحزم سكربت Docker Plugin الخاص بـ Codex من checkout المحدد.

تحل تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
محل المظلة الأقدم. يلغي مراقب الأب أي سير عمل فرعي
كان قد أرسله بالفعل عند إلغاء الأب، بحيث لا ينتظر تحقق main الأحدث
خلف تشغيل فحص إصدار قديم مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار
ومجموعات إعادة التشغيل الموجهة على `cancel-in-progress: false`.

## أجزاء live وE2E

يحافظ طفل live/E2E الخاص بالإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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
- أجزاء وسائط audio/video المقسمة وأجزاء music المفلترة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص أعطال مزود live البطيئة. تظل أسماء الأجزاء التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء وسائط live الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت هذه الصورة `ffmpeg` و`ffprobe` مسبقا؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي وGateway المجزأ حسب المزوّد وخلفية CLI وربط ACP وحزم Codex harness مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلًا من استهلاك ميزانية فحص الإصدار بالكامل. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فإعداد تشغيل الإصدار غير صحيح وسيهدر وقت التنفيذ على بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهي تختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من ملف tarball واحد عبر أداة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يقوم `resolve_package` بسحب `workflow_ref`، وحل مرشح حزمة واحد، وكتابة `.artifacts/docker-e2e-package/openclaw-current.tgz`، وكتابة `.artifacts/docker-e2e-package/package-candidate.json`، ورفع كليهما كعنصر `package-under-test`، وطباعة المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك العنصر، ويتحقق من قائمة محتويات ملف tarball، ويحضّر صور Docker ذات ملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة على تلك الحزمة بدلًا من حزم نسخة سير العمل المسحوبة. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضّر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية بعناصر فريدة.
3. يستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت عنصر `package-under-test` نفسه عندما يحل قبول الحزمة واحدًا؛ ويمكن لتشغيل Telegram المستقل أن يثبت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات المنشورة التمهيدية/المستقرة.
- يحزم `source=ref` فرعًا أو وسمًا أو SHA كاملًا لالتزام موثوقًا في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد يمكن الوصول إليه من تاريخ فرع المستودع أو وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عامًا عبر HTTPS؛ و`package_sha256` مطلوب. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو عناوين IP الخاصة/الداخلية/ذات الاستخدام الخاص، وعمليات إعادة التوجيه خارج سياسة السلامة العامة نفسها.
- ينزل `source=trusted-url` ملف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ و`package_sha256` و`trusted_source_id` مطلوبان. استخدم هذا فقط لمرايا المؤسسات أو مستودعات الحزم الخاصة المملوكة للمشرفين التي تحتاج إلى مضيفين أو منافذ أو بادئات مسارات أو مضيفي إعادة توجيه أو حل شبكة خاصة مهيأ. إذا أعلنت السياسة مصادقة bearer، يستخدم سير العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ ولا تزال بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ و`package_sha256` اختياري لكنه يجب توفيره للعناصر المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/أداة الاختبار الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح ذلك لأداة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### الملفات التعريفية للمجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم الملف التعريفي `package` تغطية Plugin دون اتصال حتى لا يعتمد التحقق من الحزمة المنشورة على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام عنصر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

للسياسة المخصصة لاختبار التحديثات وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الأعطال،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact` وعنصر حزمة الإصدار المحضّر و`suite_profile=custom` و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` و`telegram_mode=mock-openai`. يبقي ذلك إثبات ترحيل الحزمة، والتحديث، وتثبيت Skills حي من ClawHub، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin مهيأ، وPlugin دون اتصال، وplugin-update، وTelegram على ملف tarball الحزمة المحلول نفسه. عيّن `release_package_spec` في Full Release Validation أو OpenClaw Release Checks بعد نشر إصدار beta لتشغيل المصفوفة نفسها على حزمة npm المشحونة دون إعادة بناء؛ وعيّن `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بالنظام، والمثبت، وسلوك المنصة؛ ويجب أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاجز. في قبول الحزمة، يكون ملف tarball `package-under-test` المحلول هو المرشح دائمًا، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع الافتراضي `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يعيّن Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسيع عبر أحدث أربعة إصدارات npm مستقرة بالإضافة إلى إصدارات حدود توافق Plugin المثبتة والمثبتات المشكلة على شكل قضايا لإعداد Feishu وملفات bootstrap/persona المحفوظة وتثبيتات OpenClaw Plugin المهيأة ومسارات سجلات tilde وجذور اعتماديات Plugin القديمة المتقادمة. تُجزأ اختيارات ناجي الترقية المنشورة متعددة الخطوط الأساسية حسب خط الأساس إلى مهام Docker runner مستهدفة منفصلة. يستخدم سير العمل المنفصل `Update Migration` مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو التنظيف الشامل للتحديثات المنشورة، وليس اتساع CI العادي لـ Full Release. يمكن لتشغيلات التجميع المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات الحزمة والمثبت الجديدة على Windows أيضًا من أن الحزمة المثبتة يمكنها استيراد تجاوز التحكم بالمتصفح من مسار Windows مطلق خام. يستخدم اختبار الدخان لدورة وكيل OpenAI عبر أنظمة التشغيل القيمة الافتراضية `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

لدى قبول الحزمة نوافذ توافق قديمة محدودة للحزم المنشورة بالفعل. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يقلم `update-channel-switch` عناصر pnpm `patchedDependencies` المفقودة من مثبت git الوهمي المشتق من tarball وقد يسجل `update.channel` مستمرًا مفقودًا؛
- قد تقرأ اختبارات دخان Plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر الحزمة المنشورة `2026.4.26` أيضًا من ملفات ختم بيانات تعريف البناء المحلي التي كانت قد شُحنت بالفعل. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وعناصر Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل الملف التعريفي للحزمة الفاشلة أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار دخان التثبيت

يعيد سير العمل المنفصل `Install Smoke` استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يعمل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمن، أو أسطح Plugin SDK/القنوات/Plugin/Gateway الأساسية التي تمارسها مهام Docker smoke. لا تحجز تغييرات Plugin المضمن المصدرية فقط، ولا تعديلات الاختبارات فقط، ولا تعديلات التوثيق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغل smoke الخاص بـ CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغل اختبار e2e لشبكة Gateway داخل الحاوية، ويتحقق من وسيطة بناء لامتداد مضمن، ويشغل ملف Docker الشخصي المحدود لـ Plugin المضمن ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت حزمة QR وDocker/تحديث المثبت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلا أسطح المثبت/الحزم/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة GHCR smoke واحدة لـ Dockerfile الجذرية عند SHA الهدف، ثم يشغل تثبيت حزمة QR، وعمليات smoke لـ Dockerfile/Gateway الجذرية، وعمليات smoke للمثبت/التحديث، وDocker E2E السريع لـ Plugin المضمن كمهام منفصلة كي لا ينتظر عمل المثبت خلف عمليات smoke للصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند دفع، يحتفظ سير العمل بـ Docker smoke السريع ويترك smoke التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع smoke البطيء لمزود صورة تثبيت Bun العالمي لبوابة مستقلة عبر `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات تشغيل `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. ما زالت CI العادية لطلبات السحب تشغل مسار انحدار مشغل Bun السريع للتغييرات ذات الصلة بـ Node. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقا صورة اختبار مباشر مشتركة واحدة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبت نفس tarball داخل `/app` لمسارات الوظائف العادية.

تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### الإعدادات القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات المجموعة الرئيسية للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات مجموعة الذيل الحساسة للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات المباشرة المتزامنة حتى لا يفرض المزودون تقليلا للسرعة.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد المسارات المتزامنة متعددة الخدمات.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تدرج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ عينه إلى `0` لعدم استخدام التدرج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات مباشرة/ذيلية مختارة حدودا أكثر إحكاما.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى smoke التنظيف حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعال أن يبدأ رغم ذلك من مجموعة فارغة، ثم يعمل وحده حتى يحرر السعة. تجري التجميعة المحلية فحوصات تمهيدية لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل live/E2E قابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة المباشرة، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل artifact حزمة من التشغيل الحالي، أو ينزل artifact حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة Docker layer cache الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلا من إعادة البناء. يعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد بسرعة بث registry/cache العالق بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار بمهام مجزأة أصغر مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر نفس المجدول الموزون:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار حزمة Codex Plugin المباشر، الذي يثبت حزمة OpenClaw المرشحة، ويثبت Codex Plugin من `codex_plugin_spec` أو tarball من نفس المرجع مع موافقة صريحة على تثبيت Codex CLI، ويشغل فحص Codex CLI التمهيدي، ثم يشغل عدة دورات وكيل OpenClaw في الجلسة نفسها مقابل OpenAI. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية لـ Plugin/وقت التشغيل. يبقى الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبت المزود.

يطوى OpenWebUI ضمن `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء `openwebui` مستقل فقط لعمليات التشغيل الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمنة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل مدخل `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المجهزة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدودا في مهمة Docker مستهدفة واحدة ويجهز artifact الحزمة لذلك التشغيل أو ينزله أو يعيد استخدامه؛ إذا كان المسار المحدد مسارا مباشرا في Docker، تبني المهمة المستهدفة صورة الاختبار المباشر محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل في GitHub المولدة لكل مسار `package_artifact_run_id`، و`package_artifact_name`، ومدخلات الصور المجهزة عندما توجد هذه القيم، حتى يتمكن المسار الفاشل من إعادة استخدام الحزمة والصور exact نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## Plugin Prerelease

`Plugin Prerelease` تغطية منتج/حزمة أكثر كلفة، لذلك فهي سير عمل منفصل يطلقه `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات تشغيل CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمنة عبر ثمانية عمال امتدادات؛ تشغل مهام أجزاء الامتدادات تلك ما يصل إلى مجموعتي إعداد Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة Node heap أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker قبل الإصدار الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها دقيقة إلى ثلاث دقائق. يرفع سير العمل أيضا artifact معلوماتيا باسم `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ نتائج inspector هي مدخلات فرز ولا تغير بوابة Plugin Prerelease الحاجزة.

## QA Lab

يمتلك QA Lab مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل تحت حزم QA والإصدار الواسعة، وليس سير عمل مستقلا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسع.

- يشغل سير عمل `QA-Lab - All Lanes` ليليا على `main` وعند التشغيل اليدوي؛ ويفرع مسار التكافؤ الوهمي، ومسار Matrix المباشر، ومساري Telegram وDiscord المباشرين كمهام متوازية. تستخدم المهام المباشرة بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغل فحوصات الإصدار مسارات نقل Matrix وTelegram المباشرة مع المزود الوهمي الحتمي والنماذج المؤهلة وهميا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يعزل عقد القناة عن زمن استجابة النموذج المباشر وبدء Plugin المزود العادي. يعطل Gateway النقل المباشر بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة على حدة؛ وتغطي اتصال المزود مجموعات النموذج المباشر، والمزود الأصلي، ومزود Docker المنفصلة.

تستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI المسحوب ذلك. يبقى الافتراضي في CLI ومدخل سير العمل اليدوي `all`؛ وتشظي عملية التشغيل اليدوية `matrix_profile=all` دائما تغطية Matrix الكاملة إلى مهام `transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.

يشغل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزل كلا الـ artifacts في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى طلبات السحب العادية، اتبع أدلة CI/الفحوصات محددة النطاق بدلا من اعتبار التكافؤ حالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدا ماسح أمان ضيق للمرور الأول، وليس مسحا كاملا للمستودع. يوميا، ويدويا، وعند تشغيل حراسة طلبات السحب غير المسودة، يفحص كود سير عمل Actions إضافة إلى أعلى أسطح JavaScript/TypeScript خطرا باستخدام استعلامات أمان عالية الثقة مرشحة إلى `security-severity` عالية/حرجة.

تبقى حراسة طلب السحب خفيفة: لا تبدأ إلا للتغييرات تحت `.github/actions`، أو `.github/codeql`، أو `.github/workflows`، أو `packages`، أو `scripts`، أو `src`، أو مسارات وقت تشغيل Plugin المضمنة المالكة للعملية، وتشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. تبقى CodeQL الخاصة بـ Android وmacOS خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، الأسرار، sandbox، cron، وخط أساس gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية إضافة إلى وقت تشغيل Plugin القناة، gateway، Plugin SDK، الأسرار، ونقاط تماس التدقيق                      |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، تحليل IP، حارس الشبكة، web-fetch، وأسطح سياسة SSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، مساعدات تنفيذ العمليات، التسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                       |
| `/codeql-security-high/process-exec-boundary`     | الصدفة المحلية، مساعدات إنشاء العمليات، أوقات تشغيل Plugins المضمنة المالكة للعمليات الفرعية، ولصق سكربتات سير العمل               |
| `/codeql-security-high/plugin-trust-boundary`     | تثبيت Plugin، المحمّل، البيان، السجل، تثبيت مدير الحزم، تحميل المصدر، وأسطح الثقة في عقد حزمة Plugin SDK                           |

### شرائح الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شريحة أمان Android مجدولة. تبني تطبيق Android يدويا من أجل CodeQL على أصغر مشغل Blacksmith Linux يقبله فحص سلامة سير العمل. ترفع النتائج تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شريحة أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا من أجل CodeQL على Blacksmith macOS، وترشح نتائج بناء التبعيات من SARIF المرفوع، وترفع النتائج تحت `/codeql-critical-security/macos`. تبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشريحة غير الأمنية المطابقة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ فوق أسطح ضيقة وعالية القيمة على مشغلات Linux المستضافة على GitHub حتى لا تستهلك فحوصات الجودة ميزانية تسجيل مشغلات Blacksmith. حارس طلب السحب الخاص بها أصغر عمدا من ملف التعريف المجدول: طلبات السحب غير المسودة فقط تشغل شرائح `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` المطابقة لتغييرات تنفيذ أوامر/نماذج/أدوات الوكيل وتوزيع الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/sandbox/الأمان، والقناة الأساسية ووقت تشغيل Plugin القناة المضمنة، وبروتوكول gateway/طريقة الخادم، ولصق وقت تشغيل الذاكرة/SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزود/كتالوج النماذج، وتشخيصات الجلسات/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تغييرات إعداد CodeQL وسير عمل الجودة تشغل كل شرائح جودة طلب السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل شريحة جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، الأسرار، sandbox، cron، وgateway                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، الترحيل، التطبيع، والإدخال والإخراج                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، توزيع النموذج/المزود، توزيع الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، مساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، واجهات وقت تشغيل الذاكرة، أسماء Plugin SDK البديلة للذاكرة، لصق تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، طوابير تسليم الجلسات، مساعدات ربط/تسليم الجلسات الصادرة، أسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات                            |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزيع الردود الواردة في Plugin SDK، مساعدات حمولة/تقطيع/وقت تشغيل الرد، خيارات رد القنوات، طوابير التسليم، ومساعدات ربط الجلسات/الخيوط                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، مصادقة المزود واكتشافه، تسجيل وقت تشغيل المزود، افتراضات/كتالوجات المزود، وسجلات الويب/البحث/الجلب/التضمين                               |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، الاستمرارية المحلية، تدفقات تحكم gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، إدخال وإخراج الوسائط، فهم الوسائط، توليد الصور، وعقود وقت تشغيل توليد الوسائط                                                            |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، السجل، السطح العام، ونقطة دخول Plugin SDK                                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور على جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                                  |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسيع CodeQL الخاص بـ Swift وPython وPlugins المضمنة كعمل متابعة محدود النطاق أو مشرّح فقط بعد أن تستقر ملفات التعريف الضيقة من حيث وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت مؤخرا. لا يملك جدولا خالصا: يمكن لتشغيل CI ناجح من دفعة غير بوت على `main` أن يطلقه، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم، أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أنشئ خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA مصدر Docs Agent السابق غير المتخطى إلى `main` الحالي، لذلك يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولا خالصا: يمكن لتشغيل CI ناجح من دفعة غير بوت على `main` أن يطلقه، لكنه يتخطى إذا كان استدعاء آخر من تشغيل سير العمل قد شغل أو كان قيد التشغيل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبار صغيرة فقط مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمع وقت الجدار والحد الأقصى لـ RSS لكل إعداد على Linux وmacOS، لذلك تعرض مقارنة قبل/بعد فروقات ذاكرة الاختبار إلى جانب فروقات المدة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفعة البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع مجددا؛ أما الرقع القديمة المتعارضة فتتخطى. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع أمان drop-sudo نفسه مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. الوضع الافتراضي هو التشغيل الجاف ولا يغلق إلا طلبات السحب المدرجة صراحة عندما يكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدمج وأن كل مكرر لديه إما مسألة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية والتوجيه حسب التغييرات

تعيش منطق مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وينفذه `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغل فحص الأنواع لإنتاج الأساس واختبارات الأساس إضافة إلى lint/guards الأساسية؛
- تغييرات الاختبارات الأساسية فقط تشغل فقط فحص أنواع اختبارات الأساس إضافة إلى lint الأساسي؛
- تغييرات إنتاج الإضافات تشغل فحص أنواع إنتاج الإضافات واختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات اختبارات الإضافات فقط تشغل فحص أنواع اختبارات الإضافات إضافة إلى lint الإضافات؛
- تغييرات Plugin SDK العام أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود الأساس هذه (تبقى عمليات مسح إضافات Vitest عملا اختباريا صريحا)؛
- زيادات إصدار البيانات الوصفية للإصدار فقط تشغل فحوصات إصدار/إعداد/تبعية جذرية مستهدفة؛
- تغييرات الجذر/الإعدادات المجهولة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المتغيرة المحلي في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغل نفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين عبر رسم بياني الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد الخرائط الصريحة: التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجه نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا على مستوى الحزمة الاختبارية بما يكفي لأن المجموعة المرسومة الرخيصة ليست وكيلا موثوقا.

## تحقق Testbox

Crabbox هو غلاف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص أوسع من حلقة تحرير محلية، أو عندما تهم
مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار أو Docker أو مسارات حزم أو
صناديق قابلة لإعادة الاستخدام أو سجلات بعيدة. الواجهة الخلفية العادية لـ OpenClaw هي
`blacksmith-testbox`؛ أما سعة AWS/Hetzner المملوكة فهي بديل عند انقطاعات Blacksmith
أو مشكلات الحصة أو اختبار السعة المملوكة صراحة.

تشغل عمليات Blacksmith المدعومة بـ Crabbox عمليات الإحماء والمطالبة والمزامنة والتشغيل والإبلاغ والتنظيف
لـ Testboxes لمرة واحدة. يفشل فحص سلامة المزامنة المدمج بسرعة عندما تختفي
ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 حذف متتبع. بالنسبة إلى PRs ذات الحذف الكبير المقصود، اضبط
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI المحلي الذي يبقى في
مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرر المزوّد صراحة حتى لو كانت `.crabbox.yaml` تحتوي على إعدادات owned-cloud افتراضية. في أشجار عمل Codex أو عمليات checkout المرتبطة/المتناثرة، تجنب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يوفق التبعيات قبل بدء Crabbox؛ استدعِ غلاف Node مباشرة بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب العمليات المدعومة بـ Blacksmith إصدار Crabbox 0.22.0 أو أحدث حتى يحصل الغلاف على سلوك مزامنة Testbox والصف والتنظيف الحالي. عند استخدام عملية checkout الشقيقة، أعد بناء الملف الثنائي المحلي المتجاهل قبل أعمال التوقيت أو الإثبات:

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و
`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. بالنسبة إلى عمليات
Blacksmith Testbox المفوضة، يكون رمز خروج غلاف Crabbox وملخص JSON هما
نتيجة الأمر. تشغيل GitHub Actions المرتبط يملك التهيئة وإبقاء الاتصال؛ يمكنه
أن ينتهي بالحالة `cancelled` عندما يُوقف Testbox خارجيًا بعد أن يكون أمر SSH
قد عاد بالفعل. تعامل مع ذلك كأثر تنظيف/حالة ما لم يكن
`exitCode` في الغلاف غير صفري أو تُظهر مخرجات الأمر اختبارًا فاشلًا.
ينبغي لعمليات Crabbox المدعومة بـ Blacksmith لمرة واحدة أن توقف Testbox تلقائيًا؛
إذا انقطعت عملية أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط
الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق نفسه بعد تهيئته:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت طبقة Crabbox هي المعطلة لكن Blacksmith نفسه يعمل، فاستخدم
Blacksmith مباشرة فقط للتشخيصات مثل `list` و`status` والتنظيف. أصلح
مسار Crabbox قبل التعامل مع تشغيل Blacksmith مباشر كإثبات مشرف.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات
الإحماء الجديدة تبقى `queued` دون عنوان IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فتعامل مع ذلك كضغط في مزود Blacksmith أو الصف أو الفوترة أو حدود المؤسسة. أوقف
المعرفات المصطفة التي أنشأتها، وتجنب بدء المزيد من Testboxes، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة Blacksmith
والفوترة وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا أو محدود الحصة أو يفتقد البيئة المطلوبة أو عندما تكون السعة المملوكة هي الهدف صراحة:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` بـ 192 vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تضبط `.crabbox.yaml` المملوكة للمستودع القيم الافتراضية إلى `standard` ومناطق سعة متعددة و`capacity.hints: true` بحيث تطبع عقود AWS التي يتوسطها الوسيط المنطقة/السوق المحددين وضغط الحصة والرجوع إلى Spot وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوصات الواسعة الأثقل، و`large` فقط بعد أن لا يكفي standard/fast، و`beast` فقط للمسارات الاستثنائية كثيفة CPU مثل الحزمة الكاملة أو مصفوفات Docker لكل Plugin، أو تحقق الإصدار/الحاجب الصريح، أو تحليل الأداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed` أو الاختبارات المركزة أو أعمال الوثائق فقط أو lint/typecheck العادي أو إعادة إنتاج E2E الصغيرة أو فرز انقطاعات Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا تختلط تقلبات سوق Spot بالإشارة.

تملك `.crabbox.yaml` إعدادات المزود والمزامنة وتهيئة GitHub Actions الافتراضية لمسارات owned-cloud. تستثني `.git` المحلي بحيث يحتفظ checkout المهيأ من Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرف، وتستثني آثار التشغيل/البناء المحلية التي ينبغي ألا تُنقل مطلقًا. تملك `.github/workflows/crabbox-hydrate.yml` عملية checkout وإعداد Node/pnpm وجلب `origin/main` وتمرير البيئة غير السرية لأوامر owned-cloud `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

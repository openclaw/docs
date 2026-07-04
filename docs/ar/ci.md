---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح أخطاء فحص فاشل في GitHub Actions
    - أنت تنسّق تشغيل تحقق من الإصدار أو إعادة تشغيله.
    - أنت تغيّر إرسال ClawSweeper أو تمرير نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-07-04T06:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

تعمل CI الخاصة بـ OpenClaw عند كل دفع إلى `main` وكل pull request. تمر عمليات الدفع
القانونية إلى `main` أولا عبر نافذة قبول للمشغّل المستضاف مدتها 90 ثانية.
تلغي مجموعة التزامن `CI` الحالية ذلك التشغيل المنتظر عندما يصل commit أحدث،
لذلك لا تسجّل عمليات الدمج المتتالية كل منها مصفوفة Blacksmith كاملة.
تتجاوز pull requests والتشغيلات اليدوية فترة الانتظار. ثم تصنف مهمة `preflight`
الاختلاف وتوقف المسارات المكلفة عندما تتغير فقط مناطق غير مرتبطة. تتجاوز تشغيلات
`workflow_dispatch` اليدوية عمدا تحديد النطاق الذكي وتفرّع الرسم البياني الكامل
لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر
`include_android`. تغطية Plugin الخاصة بالإصدارات فقط موجودة في سير عمل
[`Plugin Prerelease`](#plugin-prerelease) المنفصل ولا تعمل إلا من
[`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                              | الغرض                                                                                                      | متى تعمل                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI                        | دائما على عمليات الدفع وPRs غير المسودة              |
| `runner-admission`                 | إزالة ارتداد مستضافة لمدة 90 ثانية لعمليات الدفع القانونية إلى `main` قبل تسجيل عمل Blacksmith             | كل تشغيل CI؛ ينام فقط على عمليات الدفع القانونية إلى `main` |
| `security-fast`                    | كشف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق ملف القفل الإنتاجي                     | دائما على عمليات الدفع وPRs غير المسودة              |
| `check-dependencies`               | تمرير Knip إنتاجي للاعتماديات فقط مع حارس قائمة السماح للملفات غير المستخدمة                              | تغييرات ذات صلة بـ Node                              |
| `build-artifacts`                  | بناء `dist/`، وControl UI، وفحوصات دخان CLI المبني، وفحوصات artifacts المبنية والمضمنة، وartifacts قابلة لإعادة الاستخدام | تغييرات ذات صلة بـ Node                              |
| `checks-fast-core`                 | مسارات صحة Linux سريعة مثل المجمّع، والبروتوكول، وQA Smoke CI، وفحوصات توجيه CI                            | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-plugins-*`  | فحصان مجزآن لعقود Plugin                                                                                   | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-channels-*` | فحصان مجزآن لعقود القنوات                                                                                  | تغييرات ذات صلة بـ Node                              |
| `checks-node-core-*`               | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمجمّع، والعقود، والامتدادات                     | تغييرات ذات صلة بـ Node                              |
| `check-*`                          | مكافئ البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج، والlint، والحراس، وأنواع الاختبار، ودخان صارم      | تغييرات ذات صلة بـ Node                              |
| `check-additional-*`               | البنية، وانجراف الحدود/المطالبات المجزأ، وحراس الامتدادات، وحدود الحزم، وطوبولوجيا وقت التشغيل            | تغييرات ذات صلة بـ Node                              |
| `checks-node-compat-node22`        | بناء توافق Node 22 ومسار دخان                                                                             | تشغيل CI يدوي للإصدارات                              |
| `check-docs`                       | تنسيق التوثيق، وlint، وفحوصات الروابط المعطلة                                                              | عند تغير التوثيق                                     |
| `skills-python`                    | Ruff + pytest للـ Skills المدعومة بـ Python                                                               | تغييرات ذات صلة بـ Skills الخاصة بـ Python           |
| `checks-windows`                   | اختبارات العمليات/المسارات الخاصة بـ Windows مع انحدارات محددات استيراد وقت التشغيل المشتركة             | تغييرات ذات صلة بـ Windows                           |
| `macos-node`                       | مسار اختبار TypeScript على macOS باستخدام artifacts المبنية المشتركة                                      | تغييرات ذات صلة بـ macOS                             |
| `macos-swift`                      | Swift lint، وبناء، واختبارات لتطبيق macOS                                                                 | تغييرات ذات صلة بـ macOS                             |
| `ios-build`                        | توليد مشروع Xcode مع بناء محاكي تطبيق iOS                                                                 | تطبيق iOS، أو عدة التطبيق المشتركة، أو تغييرات Swabble |
| `android`                          | اختبارات وحدة Android لكلا النكهتين مع بناء debug APK واحد                                                | تغييرات ذات صلة بـ Android                           |
| `test-performance-agent`           | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                        | نجاح CI الرئيسي أو تشغيل يدوي                        |
| `openclaw-performance`             | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات mock-provider، وdeep-profile، وGPT 5.5 live        | مجدول وتشغيل يدوي                                    |

## ترتيب الإخفاق السريع

1. تنتظر `runner-admission` فقط عمليات الدفع القانونية إلى `main`؛ يلغي دفع أحدث التشغيل قبل تسجيل Blacksmith.
2. تقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليست مهام مستقلة.
3. تفشل `security-fast`، و`check-*`، و`check-additional-*`، و`check-docs`، و`skills-python` بسرعة من دون انتظار مهام artifacts ومصفوفة المنصات الأثقل.
4. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يستطيع المستهلكون اللاحقون البدء فور جاهزية البناء المشترك.
5. تتفرع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core`، و`checks-fast-contracts-plugins-*`، و`checks-fast-contracts-channels-*`، و`checks-node-core-*`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`ios-build`، و`android`.

قد يعلّم GitHub المهام المستبدلة على أنها `cancelled` عندما يصل دفع أحدث إلى PR نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، وتبلغ `build-artifacts` عن إخفاقات القناة المضمنة، وcore-support-boundary، وgateway-watch مباشرة بدلا من وضع مهام تحقق صغيرة في الطابور. مفتاح تزامن CI التلقائي مؤرّخ بالإصدار (`CI-v7-*`) حتى لا يستطيع عالق من جهة GitHub في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

استخدم `pnpm ci:timings`، أو `pnpm ci:timings:recent`، أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص زمن الجدار، وزمن الطابور، وأبطأ المهام، والإخفاقات، وحاجز تفرع `pnpm-store-warmup` من GitHub Actions. ترفع CI أيضا ملخص التشغيل نفسه كـ artifact باسم `ci-timings-summary`. لتوقيت البناء، تحقق من خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` السطر `[build-all] phase timings:` ويتضمن `ui:build`؛ وترفع المهمة أيضا artifact باسم `startup-memory`.

بالنسبة إلى تشغيلات pull request، تعمل مهمة timing-summary النهائية على تشغيل المساعد من مراجعة الأساس الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. يبقي ذلك الاستعلام المزود بالتوكن خارج الكود المتحكم به من الفرع مع استمرار تلخيص تشغيل CI الحالي الخاص بـ pull request.

## سياق PR والأدلة

تشغّل PRs الخاصة بالمساهمين الخارجيين بوابة سياق PR والأدلة من
`.github/workflows/real-behavior-proof.yml`. يسحب سير العمل commit الأساس
الموثوق ويقيّم نص PR فقط؛ ولا ينفذ كودا من فرع المساهم.

تنطبق البوابة على مؤلفي PR الذين ليسوا مالكي المستودع أو أعضاءه أو
متعاونين فيه أو bots. تنجح عندما يحتوي نص PR على قسمي
`What Problem This Solves` و`Evidence` مؤلفين. يمكن أن تكون الأدلة اختبارا
مركزا، أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو خرج طرفية، أو ملاحظة live،
أو سجلا منقحا، أو رابط artifact. يوفر النص النية والتحقق المفيد؛ ويفحص
المراجعون الكود والاختبارات وCI لتقييم الصحة.

عندما يفشل الفحص، حدّث نص PR بدلا من دفع commit كود آخر.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node مع workflow linting، لكنها لا تفرض وحدها builds أصلية لـ Windows أو iOS أو Android أو macOS؛ تبقى مسارات المنصات تلك محددة النطاق بتغييرات مصدر المنصة.
- **Workflow Sanity** يشغّل `actionlint`، و`zizmor` على جميع ملفات YAML الخاصة بسير العمل، وحارس استيفاء composite-action، وحارس علامات التعارض. كما تشغّل مهمة `security-fast` المحددة بنطاق PR أداة `zizmor` على ملفات سير العمل المتغيرة حتى تفشل نتائج أمان سير العمل مبكرا في رسم CI الرئيسي.
- **التوثيق على عمليات الدفع إلى `main`** يفحصه سير عمل `Docs` المستقل باستخدام مرآة توثيق ClawHub نفسها التي تستخدمها CI، لذلك لا تضع عمليات الدفع المختلطة بين الكود والتوثيق جزء `check-docs` الخاص بـ CI في الطابور أيضا. لا تزال pull requests وCI اليدوية تشغل `check-docs` من CI عند تغير التوثيق.
- **TUI PTY** يعمل في جزء Linux Node المسمى `checks-node-core-runtime-tui-pty` لتغييرات TUI. يشغّل الجزء `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك يغطي كلا من مسار fixture الحتمي `TuiBackend` ودخان `tui --local` الأبطأ الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- **تعديلات التوجيه فقط في CI، وتعديلات fixtures رخيصة مختارة لاختبارات core، وتعديلات ضيقة لمساعدات/توجيه اختبارات عقود Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار artifacts البناء، وتوافق Node 22، وعقود القنوات، وأجزاء core الكاملة، وأجزاء Plugin المجمّع، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودا بسطوح التوجيه أو المساعد التي تمرّنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق بمغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغل npm/pnpm/UI، وإعدادات مدير الحزم، وسطوح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin ودخان التثبيت والاختبارات فقط غير المرتبطة على مسارات Linux Node.

تُقسَّم أبطأ عائلات اختبارات Node أو تُوازَن بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمنفّذين: تعمل عقود Plugins وعقود القنوات كلٌ منها كجزأين موزونين مدعومين من Blacksmith مع الرجوع القياسي إلى منفّذ GitHub، وتعمل مسارات core unit fast/support بشكل منفصل، وتُقسَّم بنية تشغيل core runtime infra بين state وprocess/config وshared وثلاثة أجزاء لنطاقات cron، ويعمل auto-reply كعمّال موزونين (مع تقسيم شجرة reply الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسَّم إعدادات agentic gateway/server عبر مسارات chat/auth/model/http-plugin/runtime/startup بدل انتظار القطع المبنية. بعد ذلك، تحزم CI العادية فقط أجزاء include-pattern المعزولة للبنية التحتية في حزم حتمية لا تتجاوز 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج مجموعات command/cron غير المعزولة، أو agents-core ذات الحالة، أو مجموعات gateway/server؛ وتبقى المجموعات الثقيلة الثابتة على 8 vCPU بينما تستخدم المسارات المجمّعة والأخف وزنًا 4 vCPU. تستخدم طلبات السحب في المستودع القانوني خطة قبول مدمجة إضافية: تعمل مجموعات كل إعداد نفسها في عمليات فرعية معزولة داخل خطة Linux Node الحالية ذات 34 مهمة، بحيث لا يسجل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main`، وعمليات التشغيل اليدوية، وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugins المتنوعة إعدادات Vitest المخصصة لها بدل الالتقاط العام المشترك للـ Plugin. تسجل أجزاء include-pattern إدخالات التوقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مرشّح. يُبقي `check-additional-*` عمل التحويل البرمجي/الكناري المرتبط بحدود الحزم معًا ويفصل بنية طوبولوجيا runtime عن تغطية مراقبة Gateway؛ وتُقسَّم قائمة حراس الحدود إلى جزء ثقيل المطالبات وجزء مدمج لشرائط الحراسة المتبقية، حيث يشغّل كلٌ منهما حراسًا مستقلين مختارين بالتوازي ويطبع توقيتات كل فحص. يعمل فحص انحراف لقطة مطالبة المسار السعيد المكلف في Codex كمهمة إضافية خاصة به في CI اليدوية وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير ذات الصلة خلف توليد لقطات المطالبات البارد، وتبقى أجزاء الحدود موزونة بينما يظل انحراف المطالبات مثبتًا على طلب السحب الذي سببه؛ وتتخطى العلامة نفسها توليد Vitest للقطات المطالبات داخل جزء حدود دعم core للقطعة المبنية. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم core بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

بعد القبول، تسمح CI القانونية على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات الأصغر fast/check؛ وتبقى Windows وAndroid عند اثنتين لأن مجموعات منفّذيها أضيق.

تُصدر خطة طلبات السحب المدمجة 18 مهمة Node للمجموعة الحالية: تُجمَّع مجموعات الإعداد الكامل في عمليات فرعية معزولة مع مهلة دفعة قدرها 120 دقيقة، بينما تشارك مجموعات include-pattern ميزانية المهام المحدودة نفسها.

تشغّل CI الخاصة بـ Android كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم تبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصادر أو manifest منفصلة؛ ولا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف debug APK مكررة عند كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (مرور Knip للإنتاج على التبعيات فقط ومثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مُراجع أو يترك إدخال allowlist قديمًا، مع الحفاظ على أسطح Plugin الديناميكية المتعمدة، والمولّدة، والبناء، والاختبارات الحية، وجسور الحزم التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى commit في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبّعة فقط: نوع الحدث، والإجراء، والممثل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، والذي ينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام هو مراقبة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو محفوفًا بالمخاطر، أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub، وتعليقاته، وأجسامه، ونصوص المراجعة، وأسماء الفروع، ورسائل commit كبيانات غير موثوقة طوال هذا المسار. هي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو runtime الوكيل.

## عمليات التشغيل اليدوية

تشغّل عمليات تشغيل CI اليدوية مخطط المهام نفسه مثل CI العادية لكنها تفرض تشغيل كل مسار محدود النطاق غير Android: أجزاء Linux Node، وأجزاء bundled-plugin، وأجزاء عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوص smoke للقطع المبنية، وفحوص الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وبناء iOS، وControl UI i18n. تعمل عمليات تشغيل CI اليدوية المستقلة على Android فقط مع `include_android=true`؛ وتفعّل مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستثنى من CI فحوص Plugins الثابتة قبل الإصدار، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومرور دفعات الإضافات الكامل، ومسارات Docker الخاصة بـ Plugins قبل الإصدار. تعمل مجموعة Docker قبل الإصدار فقط عندما تشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة بحيث لا تُلغى مجموعة كاملة لمرشح إصدار بواسطة دفعة أخرى أو تشغيل طلب سحب على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط مقابل فرع، أو وسم، أو SHA commit كامل مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المنفّذون

| المنفّذ                          | المهام                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | تشغيل CI اليدوي والرجوع في المستودعات غير القانونية، وفحوص جودة CodeQL لـ JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل الوثائق خارج CI، وتمهيد install-smoke حتى تتمكن مصفوفة Blacksmith من الاصطفاف أبكر                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، و`security-fast`، وأجزاء الإضافات الأخف وزنًا، و`checks-fast-core` باستثناء QA Smoke CI، وأجزاء عقود Plugin/القنوات، ومعظم أجزاء Linux Node المجمّعة/الأخف وزنًا، و`check-guards`، و`check-prod-types`، و`check-test-types`، وأجزاء `check-additional-*` المختارة، و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعات Linux Node الثقيلة المحتفظ بها، وأجزاء `check-additional-*` الثقيلة للحدود/الإضافات، و`android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI، و`build-artifacts` في CI وTestbox، و`check-lint` (حسّاس للمعالج بما يكفي لأن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (وقت انتظار قائمة 32-vCPU كلف أكثر مما وفر)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ وتعود forks إلى `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ وتعود forks إلى `macos-26`                                                                                                                                                                                                                     |

## ميزانية تسجيل المنفّذين

تُبلّغ حاوية تسجيل منفّذي GitHub الحالية في OpenClaw عن 10,000 تسجيل منفّذ ذاتي الاستضافة لكل 5 دقائق في `ghx api rate_limit`. أعد فحص `actions_runner_registration` قبل كل تمريرة ضبط لأن GitHub يمكن أن يغيّر هذه الحاوية. الحد مشترك بين جميع تسجيلات منفّذي Blacksmith في مؤسسة `openclaw`، لذا فإن إضافة تثبيت Blacksmith آخر لا تضيف حاوية جديدة.

تعامل مع تسميات Blacksmith كمورد نادر للتحكم في الاندفاع. يجب أن تبقى المهام التي تكتفي بالتوجيه، أو الإخطار، أو التلخيص، أو اختيار الأجزاء، أو تشغيل فحوص CodeQL قصيرة على منفّذين مستضافين لدى GitHub ما لم تكن لها احتياجات خاصة بـ Blacksmith ومقاسة. يجب أن تعرض أي مصفوفة Blacksmith جديدة، أو `max-parallel` أكبر، أو سير عمل عالي التكرار عدد التسجيلات في أسوأ الحالات وأن تبقي الهدف على مستوى المؤسسة دون نحو 60% من الحاوية الحية. مع حاوية 10,000 تسجيل الحالية، يعني ذلك هدف تشغيل قدره 6,000 تسجيل، مع ترك هامش للمستودعات المتزامنة، وإعادة المحاولات، وتداخل الاندفاع.

تبقي CI الخاصة بالمستودع القانوني Blacksmith كمسار المنفّذ الافتراضي لتشغيلات الدفع وطلبات السحب العادية. تستخدم تشغيلات `workflow_dispatch` والمستودعات غير القانونية منفّذين مستضافين لدى GitHub، لكن التشغيلات القانونية العادية لا تفحص حاليًا صحة قائمة انتظار Blacksmith ولا تعود تلقائيًا إلى تسميات مستضافة لدى GitHub عندما لا يتوفر Blacksmith.

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

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميا على `main` ويمكن تشغيله يدويا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس التشغيل اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية ضد وقت تشغيل مبني محليا مع مصادقة OpenAI متوافقة وهمية وحتمية.
- `mock-deep-profile`: إعداد ملفات تعريف CPU/الذاكرة/التتبع لنقاط الاختناق في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، يتم تخطيها عندما لا يتوفر `OPENAI_API_KEY`.

يشغل مسار mock-provider أيضا مجسات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، والخطاف، و50 Plugin؛ وRSS لاستيراد Plugin المضمن، وحلقات ترحيب `channel-chat-baseline` متكررة باستخدام OpenAI وهمي، وأوامر بدء CLI ضد Gateway الذي تم إقلاعه، ومجس أداء الدخان لحالة SQLite. عندما يتوفر تقرير مصدر mock-provider المنشور السابق للمرجع المختبَر، يقارن ملخص المصدر قيم RSS والذاكرة الحالية بخط الأساس هذا ويضع علامة `watch` على زيادات RSS الكبيرة. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، وبجواره JSON الخام.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطا، يلتزم سير العمل أيضا بـ `report.json` و`report.md` والحزم و`index.md` وartifacts مجسات المصدر إلى `openclaw/clawgrit-reports` ضمن `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعا أو وسما أو SHA كاملا للالتزام، ويشغل سير العمل اليدوي `CI` بذلك الهدف، ويشغل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغل `OpenClaw Release Checks` لدخان التثبيت، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة قياس النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تتضمن الملفات التعريفية المستقرة والكاملة دائما تغطية شاملة لمسار الإصدار الحي/E2E وDocker؛ ويمكن للملف التعريفي التجريبي الاشتراك باستخدام `run_release_soak=true`. يعمل Telegram E2E القانوني للحزمة داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل مستطلعا حيا مكررا. بعد النشر، مرر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وDocker، وعبر أنظمة التشغيل، وTelegram دون إعادة بناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة الحية لـ Codex plugin الحالة المحددة نفسها افتراضيا: `release_package_spec=openclaw@<tag>` المنشور يشتق `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تحزم تشغيلات SHA/artifact `extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحة لمصادر Plugin المخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، وفروق الملفات التعريفية، وartifacts، ومعالجات
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يغير الحالة. شغله
من `release/YYYY.M.PATCH` أو `main` بعد وجود وسم الإصدار وبعد نجاح
فحص OpenClaw npm التمهيدي. يتحقق من `pnpm plugins:sync:check`،
ويشغل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغل
`Plugin ClawHub Release` لنفس SHA الإصدار، وبعد ذلك فقط يشغل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب النشر المستقر أيضا
`windows_node_tag` دقيقا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتيه x64/ARM64 بإدخال
`windows_node_installer_digests` الموافق عليه للمرشح قبل أي فرع نشر، ثم يرقي
ويتحقق من ملخصات المثبت المثبتة نفسها إضافة إلى أصل الرفيق الدقيق
وعقد المجموع الاختباري قبل نشر مسودة إصدار GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعا أو وسوما، لا SHA التزامات خاما. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويشغل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل المتحقق الجامع أيضا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في اتساع الحي/المزود الممرر إلى فحوصات الإصدار. تستخدم
سير عمل الإصدار اليدوية `stable` افتراضيا؛ استخدم `full` فقط عندما
تريد عمدا مصفوفة المزود/الوسائط الاستشارية الواسعة. تشغل فحوصات الإصدار
المستقرة والكاملة دائما تغطية شاملة لمسار الإصدار الحي/E2E وDocker؛
ويمكن للملف التعريفي التجريبي الاشتراك باستخدام `run_release_soak=true`.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزود/الخلفية المستقرة.
- يشغل `full` مصفوفة المزود/الوسائط الاستشارية الواسعة.

يسجل الجامع معرفات تشغيل الفروع التي تم تشغيلها، وتعيد وظيفة `Verify full validation` النهائية فحص نتائج تشغيل الفروع الحالية وتلحق جداول أبطأ الوظائف لكل تشغيل فرعي. إذا أعيد تشغيل سير عمل فرعي وتحول إلى أخضر، فأعد تشغيل وظيفة المتحقق الأصل فقط لتحديث نتيجة الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لفرع CI الكامل العادي فقط، و`plugin-prerelease` لفرع الإصدار التمهيدي لـ Plugin فقط، و`release-checks` لكل فرع إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الجامع. يبقي هذا إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار واحد فاشل عبر أنظمة التشغيل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثلا `windows/packaged-upgrade`؛ تصدر أوامر عبر أنظمة التشغيل الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحص إصدار QA استشارية باستثناء بوابة تغطية أدوات وقت التشغيل القياسية، والتي تحظر عندما تنحرف أدوات OpenClaw الديناميكية المطلوبة أو تختفي من ملخص المستوى القياسي.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى tarball باسم `release-package-under-test`، ثم يمرر ذلك artifact إلى فحوصات عبر أنظمة التشغيل وPackage Acceptance، إضافة إلى سير عمل Docker لمسار الإصدار الحي/E2E عندما تعمل تغطية النقع. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تحزيم المرشح نفسه في وظائف فرعية متعددة. بالنسبة إلى مسار Codex npm-plugin الحي، تمرر فحوصات الإصدار إما مواصفة Plugin منشورة مطابقة مشتقة من `release_package_spec`، أو تمرر `codex_plugin_spec` الذي يقدمه المشغل، أو تترك الإدخال فارغا لكي يحزم سكربت Docker Plugin الخاص بـ Codex من checkout المحدد.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تستبدل الجامع الأقدم. يلغي مراقب الأصل أي سير عمل فرعي
كان قد شغله عندما يُلغى الأصل، لذلك لا تنتظر عملية تحقق main الأحدث
خلف تشغيل فحص إصدار قديم مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار
ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## شرائح الحي وE2E

يحافظ فرع الإصدار الحي/E2E على تغطية `pnpm test:live` أصلية واسعة، لكنه يشغلها كشرائح مسماة عبر `scripts/test-live-shard.mjs` بدلا من وظيفة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- وظائف `native-live-src-gateway-profiles` المرشحة حسب المزود
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شرائح وسائط صوت/فيديو مقسمة وشرائح موسيقى مرشحة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات المزود الحي البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الشرائح الجامعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شرائح الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ تتحقق وظائف الوسائط من الثنائيات فقط قبل الإعداد. أبق مجموعات الاختبار الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — فوظائف الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم شرائح النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل شرائح نموذج Docker الحي، وGateway المقسم حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة Codex باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شرائح Gateway في Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلا من استهلاك كامل ميزانية فحص الإصدار. إذا أعادت تلك الشرائح بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقت التنفيذ على بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو مختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package`‏ `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كمخرج `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance`‏ `openclaw-live-and-e2e-checks-reusable.yml` باستخدام `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك المخرج، ويتحقق من قائمة محتويات الأرشيف، ويحضر صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة على تلك الحزمة بدلا من حزم نسخة سير العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية بمخرجات فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت مخرج `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحدا؛ ولا يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات المنشورة قبل الإصدار أو المستقرة.
- يحزم `source=ref` فرعا أو وسمًا أو SHA التزام كاملا موثوقا في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التثبيت المحدد قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` أرشيف `.tgz` عاما عبر HTTPS؛ ويكون `package_sha256` مطلوبا. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو عناوين IP المحلولة الخاصة/الداخلية/ذات الاستخدام الخاص، وإعادة التوجيه خارج سياسة السلامة العامة نفسها.
- ينزل `source=trusted-url` أرشيف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ ويكون `package_sha256` و`trusted_source_id` مطلوبين. استخدم هذا فقط للمرايا المؤسسية المملوكة للمشرفين أو مستودعات الحزم الخاصة التي تحتاج إلى مضيفين أو منافذ أو بادئات مسار أو مضيفي إعادة توجيه أو حل شبكات خاصة مهيأة. إذا أعلنت السياسة مصادقة حامل، يستخدم سير العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ وتظل بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزل `source=artifact` أرشيف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختياريا، لكن ينبغي توفيره للمخرجات المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو تثبيت المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من تثبيتات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزم

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية Plugin دون اتصال بحيث لا يعتمد تحقق الحزمة المنشورة على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام مخرج `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة لعمليات التشغيل المستقلة.

للاطلاع على سياسة اختبار التحديث وPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوص الإصدار قبول الحزمة باستخدام `source=artifact`، ومخرج حزمة الإصدار المحضرة، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يحافظ هذا على إثبات ترحيل الحزمة، والتحديث، وتثبيت Skills من ClawHub الحي، وتنظيف تبعيات Plugin القديمة، وإصلاح تثبيت Plugin مهيأة، وPlugin دون اتصال، وتحديث Plugin، وTelegram على أرشيف الحزمة المحلول نفسه. اضبط `release_package_spec` في Full Release Validation أو OpenClaw Release Checks بعد نشر إصدار تجريبي لتشغيل المصفوفة نفسها على حزمة npm المشحونة دون إعادة البناء؛ واضبط `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. لا تزال فحوص الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي، والمثبت، وسلوك المنصة الخاص بكل نظام تشغيل؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاجز. في قبول الحزمة، يكون أرشيف `package-under-test` المحلول هو المرشح دائما، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، وافتراضيا `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسيع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبتة وتركيبات على شكل مشكلات لتهيئة Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات Plugin OpenClaw المهيأة، ومسارات سجل التلدة، وجذور تبعيات Plugin القديمة الراكدة. يتم تقسيم اختيارات ناجي الترقية المنشورة متعددة الخطوط الأساسية حسب خط الأساس إلى مهام مشغل Docker مستهدفة منفصلة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديث المنشور الشامل، وليس سعة CI للإصدار الكامل العادي. يمكن لعمليات التشغيل المحلية المجمعة تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الجديدة للحزمة والمثبت أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز browser-control من مسار Windows مطلق خام. يستخدم فحص دخان دورة وكيل OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيا عندما يكون مضبوطا، وإلا `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

لدى قبول الحزمة نوافذ توافق قديمة محدودة للحزم المنشورة مسبقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من الأرشيف؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم pnpm `patchedDependencies` المفقودة من تركيبة git الزائفة المشتقة من الأرشيف، وقد يسجل غياب `update.channel` المستمر؛
- قد تقرأ فحوص Plugin الدخانية مواقع سجلات التثبيت القديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التهيئة مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا من ملفات ختم بيانات تعريف البناء المحلي التي شُحنت سابقا. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة، والإصدار، وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` ومخرجات Docker الخاصة به: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلا من إعادة تشغيل تحقق الإصدار الكامل.

## فحص دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يعمل **المسار السريع** لطلبات السحب التي تمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin SDK/Plugin/القناة/gateway الأساسية التي تمرنها مهام Docker smoke. لا تحجز تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغل smoke لحذف الوكلاء لمساحة العمل المشتركة عبر CLI، ويشغل e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء امتداد مضمّن، ويشغل ملف تعريف Docker المحدود لـ bundled-plugin ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع تحديد تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت حزمة QR وDocker/update للمثبّت للتشغيلات الليلية المجدولة، وعمليات الإرسال اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلا أسطح المثبّت/الحزم/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة GHCR smoke واحدة لـ Dockerfile الجذرية عند target-SHA، ثم يشغل تثبيت حزمة QR، وsmokes لـ Dockerfile/gateway الجذرية، وsmokes للمثبّت/update، وDocker E2E السريع لـ bundled-plugin كمهام منفصلة بحيث لا ينتظر عمل المثبّت خلف smokes صورة الجذر.

لا تفرض دفعات `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند دفعة، يبقي سير العمل Docker smoke السريع ويترك install smoke الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع smoke البطيء لتثبيت Bun العام الخاص بموفر الصور بشكل منفصل للبوابة `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لإرسالات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. لا يزال CI العادي لطلبات السحب يشغل مسار انحدار مشغل Bun السريع للتغييرات ذات الصلة بـ Node. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقا صورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git مجرد لمسارات المثبّت/update/اعتماديات Plugin؛
- صورة وظيفية تثبت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويوجد منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات المجمّع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات مجمّع الذيل الحساس للموفر.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تفرض الموفرات خنقا.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد المسارات المتزامنة متعددة الخدمات.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التدرج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ عيّن `0` لعدم وجود تدرج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات live/tail المحددة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معين   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معين   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز smoke التنظيف حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن أن يبدأ مسار أثقل من حده الفعال من مجمّع فارغ، ثم يعمل وحده حتى يحرر السعة. تجري التجميعة المحلية فحوصات تمهيدية على Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمّعة جديدة بعد الفشل الأول.

### سير عمل live/E2E قابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات GitHub وملخصات. إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل عنصر حزمة من التشغيل الحالي، أو ينزل عنصر حزمة من `package_artifact_run_id`؛ يتحقق من مخزون ملف tarball؛ يبني ويدفع صور GHCR Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة Blacksmith المؤقتة لطبقات Docker عندما تحتاج الخطة إلى مسارات مثبتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلا من إعادة البناء. تعاد محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعيد تدفق registry/cache العالق المحاولة بسرعة بدلا من استهلاك معظم المسار الحرج لـ CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار عبر مهام أصغر مقسمة إلى أجزاء مع `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار حزمة Codex Plugin الحي، الذي يثبت حزمة OpenClaw المرشحة، ويثبت Codex Plugin من `codex_plugin_spec` أو ملف tarball من المرجع نفسه مع موافقة صريحة على تثبيت Codex CLI، ويشغل الفحص التمهيدي لـ Codex CLI، ثم يشغل عدة أدوار لوكيل OpenClaw في الجلسة نفسها مقابل OpenAI. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية لـ Plugin/runtime. يبقى الاسم المستعار للمسار `install-e2e` اسما مستعارا تجميعيا لإعادة التشغيل اليدوية لكلا مساري مثبّت الموفر.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لإرسالات OpenWebUI فقط. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل شبكة npm العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغل إدخال سير العمل `docker_lanes` المسارات المحددة مقابل الصور الجاهزة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدودا بمهمة Docker مستهدفة واحدة ويجهز عنصر الحزمة أو ينزله أو يعيد استخدامه لذلك التشغيل؛ إذا كان المسار المحدد مسارا حيا في Docker، تبني المهمة المستهدفة صورة الاختبار الحي محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة تشغيل GitHub المولدة لكل مسار `package_artifact_run_id`، و`package_artifact_name`، ومدخلات الصور الجاهزة عند وجود تلك القيم، حتى يمكن لمسار فاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # تنزيل عناصر Docker وطباعة أوامر إعادة التشغيل المستهدفة المجمعة/لكل مسار
pnpm test:docker:timings <summary>   # ملخصات المسارات البطيئة والمسار الحرج للمراحل
```

يشغل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## ما قبل إصدار Plugin

`Plugin Prerelease` تغطية منتج/حزمة أعلى تكلفة، لذلك هو سير عمل منفصل يرسله `Full Release Validation` أو مشغل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وإرسالات CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال امتداد؛ تشغل مهام أجزاء الامتداد هذه حتى مجموعتين من إعدادات Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker قبل الإصدار الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها دقيقة إلى ثلاث دقائق. يرفع سير العمل أيضا عنصر `plugin-inspector-advisory` إعلاميا من `@openclaw/plugin-inspector`؛ نتائج inspector هي مدخلات فرز ولا تغير بوابة Plugin Prerelease الحاجزة.

## مختبر QA

لدى مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل ضمن أدوات QA والإصدار الواسعة، وليس سير عمل مستقلا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسع.

- يشغل سير عمل `QA-Lab - All Lanes` ليليا على `main` وعند الإرسال اليدوي؛ ويفرّع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغل فحوصات الإصدار مسارات نقل Matrix وTelegram الحية مع موفر وهمي حتمي ونماذج مؤهلة بالوهم (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل provider-plugin العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النموذج الحي المنفصلة، والموفر الأصلي، وموفر Docker اتصال الموفر.

يستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI الذي تم checkout له ذلك. تبقى القيمة الافتراضية لـ CLI وإدخال سير العمل اليدوي `all`؛ ويقسم إرسال `matrix_profile=all` اليدوي دائما تغطية Matrix الكاملة إلى مهام `transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.

يشغل `OpenClaw Release Checks` أيضا مسارات مختبر QA الحرجة للإصدار قبل موافقة الإصدار؛ تشغل بوابة تكافؤ QA الخاصة به حزم المرشح والخط الأساسي كمهام مسارات متوازية، ثم تنزل كلا العنصرين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحص ذات النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدا ماسح أمان ضيق للمرور الأول، وليس مسحا كاملا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرا باستخدام استعلامات أمان عالية الثقة مرشحة إلى `security-severity` عال/حرج.

تبقى حراسة طلب السحب خفيفة: لا تبدأ إلا للتغييرات ضمن `.github/actions`، أو `.github/codeql`، أو `.github/workflows`، أو `packages`، أو `scripts`، أو `src`، أو مسارات runtime الخاصة بـ Plugin المضمّن التي تملك العملية، وتشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى Android وmacOS CodeQL خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | خط أساس المصادقة والأسرار وصندوق العزل وCron وGateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية، إضافة إلى وقت تشغيل Plugin القناة وGateway وPlugin SDK والأسرار ونقاط تماس التدقيق                     |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسات SSRF في Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/process-exec-boundary`     | الصدفة المحلية، ومساعدات إنشاء العمليات، وأوقات تشغيل Plugins المضمنة المالكة للعمليات الفرعية، وغراء نصوص سير العمل              |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                       |

### شظايا الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويًا من أجل CodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا من أجل CodeQL على Blacksmith macOS، وتستبعد نتائج بناء التبعيات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. أُبقيت خارج الافتراضيات اليومية لأن بناء macOS يهيمن على مدة التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المطابقة. لا تشغّل إلا استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة أخطاء فقط، على أسطح ضيقة عالية القيمة في مشغلات Linux المستضافة على GitHub، حتى لا تستهلك فحوص الجودة ميزانية تسجيل مشغلات Blacksmith. حارس طلبات السحب فيها أصغر عمدًا من ملف التعريف المجدول: طلبات السحب غير المسودة لا تشغّل إلا شظايا `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط التكوين/الترحيل/الإدخال والإخراج، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمنة، وبروتوكول Gateway/طريقة الخادم، وغراء وقت تشغيل الذاكرة/SDK، وMCP/العمليات/التسليم الصادر، وكتالوج وقت تشغيل/نماذج المزوّد، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تغييرات تكوين CodeQL وسير عمل الجودة تشغّل كل شظايا جودة طلبات السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطاطيف تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وصندوق العزل وCron وGateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط التكوين والترحيل والتطبيع والإدخال والإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النماذج/المزوّدين، وإرسال الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى التحكم ACP                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات                   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/السلسلة                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين                     |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم في المهام                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                       |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور في جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                               |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. ينبغي أن تُعاد توسعة CodeQL الخاصة بـ Swift وPython وPlugins المضمنة كعمل لاحق محدود النطاق أو مجزأ فقط بعد أن تستقر ملفات التعريف الضيقة من حيث مدة التشغيل والإشارة.

## سير عمل الصيانة

### وكيل التوثيق

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث للحفاظ على اتساق التوثيق الحالي مع التغييرات التي هبطت مؤخرًا. لا يملك جدولًا صرفًا: يمكن لتشغيل CI ناجح ناتج عن دفع غير آلي إلى `main` أن يفعّله، كما يمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل آخر غير متخطى من Docs Agent قد أُنشئ في الساعة الأخيرة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل ساعي واحد أن يغطي كل تغييرات main المتراكمة منذ آخر مرور للتوثيق.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولًا صرفًا: يمكن لتشغيل CI ناجح ناتج عن دفع غير آلي إلى `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد عمل أو يعمل بالفعل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعًا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبارات صغيرة فقط مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمع زمن الجدار لكل تكوين والحد الأقصى لـ RSS على Linux وmacOS، لذلك يبرز مقارنة ما قبل/بعد فروق ذاكرة الاختبارات بجانب فروق المدة. إذا كان خط الأساس يحتوي اختبارات فاشلة، يجوز لـ Codex إصلاح الفشل الواضح فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ أما الرقع القديمة المتعارضة فتُتخطى. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع أمان drop-sudo نفسه مثل وكيل التوثيق.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يفترض التشغيل الجاف ولا يغلق إلا طلبات السحب المدرجة صراحة عندما يكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الذي هبط قد دُمج وأن كل تكرار لديه إما مشكلة مرجعية مشتركة أو مقاطع تغيير متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

منطق مسارات التغيير المحلي موجود في `scripts/changed-lanes.mjs` وينفذه `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغّل فحص أنواع إنتاج النواة واختباراتها، إضافة إلى فحص lint/الحراس للنواة؛
- تغييرات الاختبارات فقط في النواة تشغّل فحص أنواع اختبارات النواة فقط، إضافة إلى lint النواة؛
- تغييرات إنتاج الامتدادات تشغّل فحص أنواع إنتاج الامتدادات واختباراتها، إضافة إلى lint الامتدادات؛
- تغييرات الاختبارات فقط في الامتدادات تشغّل فحص أنواع اختبارات الامتدادات، إضافة إلى lint الامتدادات؛
- تغييرات Plugin SDK العام أو عقد Plugin تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود النواة هذه (تبقى مسوحات امتدادات Vitest عمل اختبارات صريحًا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوص إصدار/تكوين/تبعية جذرية مستهدفة؛
- تغييرات الجذر/التكوين المجهولة تفشل بأمان إلى كل مسارات الفحص.

توجيه الاختبارات المتغيرة المحلي موجود في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبار المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر التعيينات الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. تكوين تسليم غرف المجموعات المشتركة هو أحد التعيينات الصريحة: التغييرات في تكوين الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير الافتراض المشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا بما يكفي على مستوى الحاضنة بحيث لا تكون المجموعة الرخيصة المعينة وكيلًا موثوقًا.

## تحقق Testbox

Crabbox هو مغلّف الصناديق البعيدة المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص أوسع من أن يناسب حلقة تحرير محلية، أو عندما تكون
مطابقة CI مهمة، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات الحزم،
أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. الواجهة الخلفية العادية في OpenClaw هي
`blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة خيارًا احتياطيًا عند أعطال Blacksmith
أو مشكلات الحصة أو الاختبار الصريح على السعة المملوكة.

تقوم تشغيلات Blacksmith المدعومة من Crabbox بالتسخين، والمطالبة، والمزامنة، والتشغيل، والإبلاغ، وتنظيف
Testboxes لمرة واحدة. يفشل فحص سلامة المزامنة المدمج سريعًا عندما تختفي
ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 حذف متتبَّع. بالنسبة إلى PRs الحذف الكبير المتعمد، اضبط
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI محليًا يبقى في
مرحلة المزامنة لأكثر من خمس دقائق دون إخراج بعد المزامنة. اضبط
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالملي ثانية للفروقات المحلية الكبيرة على غير المعتاد.

قبل أول تشغيل، تحقق من المغلّف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض مغلّف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً حتى وإن كانت `.crabbox.yaml` تحتوي على إعدادات افتراضية للسحابة المملوكة. في أشجار عمل Codex أو عمليات checkout المرتبطة/المتناثرة، تجنب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يوفق التبعيات قبل أن يبدأ Crabbox؛ استدعِ مغلّف node مباشرةً بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب التشغيلات المدعومة من Blacksmith إصدار Crabbox 0.22.0 أو أحدث حتى يحصل المغلّف على سلوك مزامنة Testbox والانتظار والتنظيف الحالي. عند استخدام عملية checkout الشقيقة، أعد بناء الملف الثنائي المحلي المتجاهَل قبل أعمال التوقيت أو الإثبات:

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
و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. بالنسبة إلى تشغيلات
Blacksmith Testbox المفوّضة، فإن رمز خروج مغلّف Crabbox وملخص JSON هما
نتيجة الأمر. تشغيل GitHub Actions المرتبط يملك الترطيب وkeepalive؛ ويمكن أن
ينتهي بحالة `cancelled` عندما يتم إيقاف Testbox خارجيًا بعد أن يكون أمر SSH
قد عاد بالفعل. تعامل مع ذلك كأثر تنظيف/حالة ما لم يكن
`exitCode` الخاص بالمغلّف غير صفري أو يُظهر إخراج الأمر اختبارًا فاشلًا.
ينبغي لتشغيلات Crabbox المدعومة من Blacksmith لمرة واحدة أن توقف Testbox تلقائيًا؛
إذا تمت مقاطعة تشغيل أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط
الصناديق التي أنشأتها:

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

إذا كانت الطبقة المعطلة هي Crabbox لكن Blacksmith نفسه يعمل، فاستخدم
Blacksmith مباشرةً فقط للتشخيصات مثل `list` و`status` والتنظيف. أصلح
مسار Crabbox قبل اعتبار تشغيل Blacksmith مباشرًا إثباتًا للمشرف.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن
عمليات التسخين الجديدة تبقى `queued` دون IP أو URL لتشغيل Actions بعد دقيقتين،
فاعتبر ذلك ضغطًا من مزوّد Blacksmith أو الانتظار أو الفوترة أو حدود المؤسسة. أوقف
معرّفات الانتظار التي أنشأتها، وتجنب بدء Testboxes إضافية، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يتحقق شخص ما من لوحة معلومات Blacksmith
والفواتير وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPUs وهو أسهل طريقة لتجاوز حصة EC2 Spot أو On-Demand Standard الإقليمية. تضبط `.crabbox.yaml` المملوكة للمستودع الإعدادات الافتراضية على `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع عقود AWS المؤجرة عبر الوسيط المنطقة/السوق المختار، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوصات العريضة الأثقل، و`large` فقط بعد أن لا تكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المقيدة بالـ CPU مثل المجموعة الكاملة أو مصفوفات Docker لكل Plugins، أو تحقق الإصدارات/الحواجز الصريح، أو تحليل الأداء عالي النوى. لا تستخدم `beast` مع `pnpm check:changed` أو الاختبارات المركزة أو العمل الخاص بالوثائق فقط أو الفحص العادي lint/typecheck أو عمليات إعادة إنتاج E2E الصغيرة أو فرز أعطال Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط تقلب سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` إعدادات المزوّد والمزامنة وترطيب GitHub Actions الافتراضية لمسارات السحابة المملوكة. وهي تستثني `.git` المحلي حتى تحتفظ عملية checkout المرطّبة في Actions ببيانات Git البعيدة الخاصة بها بدلًا من مزامنة remotes ومخازن الكائنات المحلية للمشرف، وتستثني آثار التشغيل/البناء المحلية التي لا ينبغي نقلها أبدًا. تمتلك `.github/workflows/crabbox-hydrate.yml` عملية checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر `crabbox run --id <cbx_id>` الخاصة بالسحابة المملوكة.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها.
    - أنت تصحّح فحص GitHub Actions فاشلًا
    - أنت تنسّق تشغيل تحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر توجيه ClawSweeper أو إعادة توجيه نشاط GitHub
summary: رسم مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-06-30T14:01:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

يعمل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تمر دفعات
`main` المعيارية أولا عبر نافذة قبول مدتها 90 ثانية على مشغل مستضاف.
تلغي مجموعة التزامن الحالية `CI` ذلك التشغيل المنتظر عند وصول تثبيت أحدث،
لذلك لا تسجل عمليات الدمج المتتابعة مصفوفة Blacksmith كاملة لكل منها.
تتجاوز طلبات السحب والتشغيلات اليدوية الانتظار. ثم تصنف مهمة `preflight`
الفروقات وتوقف المسارات المكلفة عندما لا تتغير إلا مناطق غير مرتبطة.
تتجاوز تشغيلات `workflow_dispatch` اليدوية عمدا تحديد النطاق الذكي
وتوسع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات
Android اختيارية عبر `include_android`. تعيش تغطية Plugin الخاصة بالإصدار
فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)
ولا تعمل إلا من [`Full Release Validation`](#full-release-validation)
أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                             | الغرض                                                                                                      | متى تعمل                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                         | دائما عند الدفعات وطلبات السحب غير المسودة          |
| `runner-admission`                 | إزالة ارتداد مستضافة لمدة 90 ثانية لدفعات `main` المعيارية قبل تسجيل عمل Blacksmith                       | كل تشغيل CI؛ ينام فقط عند دفعات `main` المعيارية    |
| `security-fast`                    | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق ملف القفل الإنتاجي                  | دائما عند الدفعات وطلبات السحب غير المسودة          |
| `check-dependencies`               | تمرير Knip الإنتاجي الخاص بالاعتماديات فقط إضافة إلى حارس قائمة السماح للملفات غير المستخدمة              | تغييرات ذات صلة بـ Node                             |
| `build-artifacts`                  | بناء `dist/`، وControl UI، وفحوص دخان CLI المبنية، وفحوص عناصر البناء المضمنة، والعناصر القابلة لإعادة الاستخدام | تغييرات ذات صلة بـ Node                             |
| `checks-fast-core`                 | مسارات صحة Linux السريعة مثل المضمن، والبروتوكول، وQA Smoke CI، وفحوص توجيه CI                            | تغييرات ذات صلة بـ Node                             |
| `checks-fast-contracts-plugins-*`  | فحصان مجزآن لعقود Plugin                                                                                  | تغييرات ذات صلة بـ Node                             |
| `checks-fast-contracts-channels-*` | فحصان مجزآن لعقود القنوات                                                                                 | تغييرات ذات صلة بـ Node                             |
| `checks-node-core-*`               | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمضمن، والعقود، والإضافات                       | تغييرات ذات صلة بـ Node                             |
| `check-*`                          | مكافئ بوابة محلية رئيسية مجزأة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، والدخان الصارم        | تغييرات ذات صلة بـ Node                             |
| `check-additional-*`               | البنية، وانحراف الحدود/المطالبات المجزأ، وحراس الإضافات، وحدود الحزم، وطوبولوجيا وقت التشغيل             | تغييرات ذات صلة بـ Node                             |
| `checks-node-compat-node22`        | بناء توافق Node 22 ومسار دخان                                                                            | تشغيل CI يدوي للإصدارات                             |
| `check-docs`                       | تنسيق الوثائق، والفحص، وفحوص الروابط المعطلة                                                              | عند تغير الوثائق                                    |
| `skills-python`                    | Ruff + pytest للـ Skills المدعومة بـ Python                                                              | تغييرات ذات صلة بـ Python-skill                     |
| `checks-windows`                   | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة      | تغييرات ذات صلة بـ Windows                          |
| `macos-node`                       | مسار اختبار TypeScript على macOS باستخدام عناصر البناء المشتركة                                           | تغييرات ذات صلة بـ macOS                            |
| `macos-swift`                      | فحص Swift، والبناء، والاختبارات لتطبيق macOS                                                              | تغييرات ذات صلة بـ macOS                            |
| `ios-build`                        | إنشاء مشروع Xcode إضافة إلى بناء محاكي تطبيق iOS                                                         | تطبيق iOS، أو مجموعة التطبيق المشتركة، أو تغييرات Swabble |
| `android`                          | اختبارات وحدة Android لكلا النكهتين إضافة إلى بناء APK تصحيح واحد                                        | تغييرات ذات صلة بـ Android                          |
| `test-performance-agent`           | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                        | نجاح CI الرئيسي أو تشغيل يدوي                       |
| `openclaw-performance`             | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات mock-provider، وdeep-profile، ومسارات GPT 5.5 الحية | تشغيل مجدول ويدوي                                   |

## ترتيب الفشل السريع

1. تنتظر `runner-admission` فقط دفعات `main` المعيارية؛ تلغي دفعة أحدث التشغيل قبل تسجيل Blacksmith.
2. تقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهاما مستقلة.
3. تفشل `security-fast`، و`check-*`، و`check-additional-*`، و`check-docs`، و`skills-python` بسرعة من دون انتظار مهام العناصر ومصفوفة المنصات الأثقل.
4. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
5. تتفرع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core`، و`checks-fast-contracts-plugins-*`، و`checks-fast-contracts-channels-*`، و`checks-node-core-*`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`ios-build`، و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تم تجاوزها عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main` نفسه. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، ويبلغ `build-artifacts` عن إخفاقات القناة المضمنة، وحدود دعم النواة، وgateway-watch مباشرة بدلا من وضع مهام تحقق صغيرة في الطابور. مفتاح تزامن CI التلقائي مؤطر بإصدار (`CI-v7-*`) حتى لا يتمكن تشغيل GitHub عالق في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

استخدم `pnpm ci:timings`، أو `pnpm ci:timings:recent`، أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص وقت الجدار، ووقت الطابور، وأبطأ المهام، والإخفاقات، وحاجز تفرع `pnpm-store-warmup` من GitHub Actions. يرفع CI أيضا ملخص التشغيل نفسه كعنصر `ci-timings-summary`. لتوقيت البناء، تحقق من خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` السطر `[build-all] phase timings:` ويتضمن `ui:build`؛ كما ترفع المهمة عنصر `startup-memory`.

بالنسبة إلى تشغيلات طلبات السحب، تشغل مهمة ملخص التوقيت النهائية المساعد من مراجعة الأساس الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. يبقي ذلك الاستعلام المزود بالرمز المميز خارج الشيفرة التي يتحكم بها الفرع مع الاستمرار في تلخيص تشغيل CI الحالي لطلب السحب.

## سياق طلب السحب والأدلة

تشغل طلبات السحب من المساهمين الخارجيين بوابة سياق طلب السحب والأدلة من
`.github/workflows/real-behavior-proof.yml`. يتحقق سير العمل من تثبيت الأساس
الموثوق ويقيم نص طلب السحب فقط؛ ولا ينفذ شيفرة من فرع المساهم.

تنطبق البوابة على مؤلفي طلبات السحب الذين ليسوا مالكي المستودع، أو أعضاءه،
أو المتعاونين فيه، أو بوتات. تنجح عندما يحتوي نص طلب السحب على قسمي
`What Problem This Solves` و`Evidence` مؤلفين. يمكن أن تكون الأدلة اختبارا
مركزا، أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو خرج طرفية، أو ملاحظة حية،
أو سجلا منقحا، أو رابط عنصر. يوفر النص النية والتحقق المفيد؛ ويفحص
المراجعون الشيفرة، والاختبارات، وCI لتقييم الصحة.

عند فشل الفحص، حدث نص طلب السحب بدلا من دفع تثبيت شيفرة آخر.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف changed-scope ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى فحص سير العمل، لكنها لا تفرض بنفسها عمليات بناء Windows، أو iOS، أو Android، أو macOS الأصلية؛ تبقى مسارات المنصات هذه محددة النطاق إلى تغييرات مصدر المنصة.
- **Workflow Sanity** يشغل `actionlint`، و`zizmor` على كل ملفات YAML لسير العمل، وحارس استيفاء composite-action، وحارس علامات التعارض. تشغل مهمة `security-fast` المحددة النطاق لطلب السحب أيضا `zizmor` على ملفات سير العمل المتغيرة حتى تفشل نتائج أمان سير العمل مبكرا في رسم CI الرئيسي.
- **الوثائق عند دفعات `main`** يفحصها سير عمل `Docs` المستقل باستخدام مرآة وثائق ClawHub نفسها التي يستخدمها CI، لذلك لا تصف دفعات الشيفرة+الوثائق المختلطة جزء CI `check-docs` أيضا. لا تزال طلبات السحب وCI اليدوي تشغل `check-docs` من CI عند تغير الوثائق.
- **TUI PTY** يعمل في جزء Linux Node `checks-node-core-runtime-tui-pty` لتغييرات TUI. يشغل الجزء `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك يغطي كلا من مسار تجهيز `TuiBackend` الحتمي ودخان `tui --local` الأبطأ الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- **تعديلات توجيه CI فقط، وتعديلات تجهيز اختبارات النواة الرخيصة المحددة، وتعديلات مساعد/توجيه اختبار عقد Plugin الضيقة** تستخدم مسار بيان Node-only سريعا: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار عناصر البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمنة، ومصفوفات الحراسة الإضافية عندما يكون التغيير محدودا بأسطح التوجيه أو المساعد التي تمرنها المهمة السريعة مباشرة.
- **فحوص Windows Node** محددة النطاق إلى مغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغل npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير المرتبطة، وPlugin، ودخان التثبيت، والاختبار فقط على مسارات Linux Node.

تُقسَّم أبطأ عائلات اختبارات Node أو تُوازَن بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغّلات: تعمل عقود Plugin وعقود القنوات كلٌ منها كجزأين موزونين مدعومين من Blacksmith مع الرجوع القياسي إلى مشغّل GitHub، وتعمل مسارات core unit fast/support كلٌ على حدة، وتُقسَّم بنية runtime infra الأساسية بين state وprocess/config وshared وثلاثة أجزاء لنطاق Cron، ويعمل auto-reply كعمّال متوازنين (مع تقسيم الشجرة الفرعية للردود إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسَّم إعدادات Gateway/الخادم الوكيلية عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلاً من انتظار المصنوعات المبنية. بعد ذلك لا تحزم CI العادية إلا أجزاء أنماط التضمين المعزولة الخاصة بالبنية التحتية في حزم حتمية لا تتجاوز 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج مجموعات non-isolated command/cron أو stateful agents-core أو gateway/server؛ وتبقى المجموعات الثقيلة الثابتة على 8 vCPU بينما تستخدم المسارات المجمّعة والأخف وزناً 4 vCPU. تستخدم طلبات السحب على المستودع الأساسي خطة قبول مضغوطة إضافية: تعمل المجموعات نفسها لكل إعداد في عمليات فرعية معزولة داخل خطة Linux Node الحالية المكوّنة من 34 مهمة، بحيث لا يسجل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main`، والتشغيلات اليدوية، وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلاً من مجمّع Plugin المشترك العام. تسجّل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يمكن لـ`.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مفلتر. يحافظ `check-additional-*` على عمل ترجمة/كاناري حدود الحزم معاً ويفصل بنية طوبولوجيا runtime عن تغطية مراقبة Gateway؛ تُقسَّم قائمة حراس الحدود إلى جزء كثيف المطالبات وجزء مدمج لشرائط الحراس المتبقية، حيث يشغّل كلٌ منها حراساً مستقلة مختارة بالتوازي ويطبع توقيتات كل فحص. يعمل فحص انحراف لقطة مطالبات Codex happy-path المكلف كمهمة إضافية مستقلة لـ CI اليدوية وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير ذات الصلة خلف توليد لقطات مطالبات باردة وتبقى أجزاء الحدود متوازنة، بينما يظل انحراف المطالبات مثبتاً في طلب السحب الذي سببه؛ وتتجاوز الراية نفسها توليد Vitest للقطات المطالبات داخل جزء support-boundary الأساسي الخاص بالمصنوعات المبنية. تعمل مراقبة Gateway، واختبارات القنوات، وجزء support-boundary الأساسي بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

بعد القبول، تسمح CI الأساسية على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات الأصغر fast/check؛ وتبقى Windows وAndroid عند اثنتين لأن مجمعات تلك المشغّلات أضيق.

تصدر خطة PR المضغوطة 18 مهمة Node للمجموعة الحالية: تُدفَّع مجموعات الإعداد الكامل في عمليات فرعية معزولة مع مهلة دفعة قدرها 120 دقيقة، بينما تتشارك مجموعات أنماط التضمين ميزانية المهام المحدودة نفسها.

تشغّل Android CI كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم تبني Play debug APK. لا تحتوي نكهة الطرف الثالث على مجموعة مصادر أو manifest منفصلة؛ ولا يزال مسار اختبارات الوحدة الخاص بها يترجم النكهة مع رايات BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف debug APK مكررة عند كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (مرور Knip للإنتاج على التبعيات فقط، مثبت على أحدث إصدار من Knip، مع تعطيل حد العمر الأدنى للإصدار الخاص بـ pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الخاصة بملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفاً جديداً غير مستخدم ولم تتم مراجعته أو يترك إدخال allowlist قديماً، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبارات الحية وجسور الحزم المقصودة التي لا يستطيع Knip حلها ثابتاً.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر على جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يتضمن سير العمل أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى commit عند دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمداً تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، وينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليماً افتراضياً. يتلقى وكيل ClawSweeper هدف Discord في مطالبته وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئاً أو قابلاً للتنفيذ أو محفوفاً بالمخاطر أو مفيداً تشغيلياً. ينبغي أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج البوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

عامِل عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل commits كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو runtime الوكيل.

## التشغيلات اليدوية

تشغّل تشغيلات CI اليدوية مخطط المهام نفسه مثل CI العادية لكنها تفرض تشغيل كل مسار محدود النطاق غير Android: أجزاء Linux Node، وأجزاء Plugins المجمّعة، وأجزاء عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات الدخان للمصنوعات المبنية، وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وبناء iOS، وControl UI i18n. تشغّل تشغيلات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتفعّل مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستثنى من CI فحوصات Plugin prerelease الثابتة، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومسح دفعات الإضافات الكامل، ومسارات Docker الخاصة بـ Plugin prerelease. لا تعمل مجموعة Docker prerelease إلا عندما يشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة بحيث لا تُلغى مجموعة مرشح إصدار كاملة بسبب دفعة أخرى أو تشغيل PR على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط على فرع أو وسم أو SHA كامل لـ commit مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                         | المهام                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | تشغيل CI اليدوي وبدائل المستودعات غير الأساسية، وفحوصات جودة CodeQL JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل الوثائق خارج CI، ومرحلة install-smoke التمهيدية كي تتمكن مصفوفة Blacksmith من الاصطفاف مبكراً                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، و`security-fast`، وأجزاء الإضافات الأخف وزناً، و`checks-fast-core`، وأجزاء عقود Plugin/القنوات، ومعظم أجزاء Linux Node المجمّعة/الأخف وزناً، و`check-guards`، و`check-prod-types`، و`check-test-types`، وأجزاء مختارة من `check-additional-*`، و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعات Linux Node الثقيلة المحتفظ بها، وأجزاء `check-additional-*` الثقيلة على الحدود/الإضافات، و`android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، و`check-lint` (حساسان بما يكفي للمعالج بحيث كلّف 8 vCPU أكثر مما وفّر)؛ وبناءات Docker الخاصة بـ install-smoke (كلّف وقت انتظار طابور 32-vCPU أكثر مما وفّر)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ وتعود الفروع المتشعبة إلى `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ وتعود الفروع المتشعبة إلى `macos-26`                                                                                                                                                                                                  |

## ميزانية تسجيل المشغّلات

تبلغ حاوية تسجيل المشغّلات الحالية في GitHub الخاصة بـ OpenClaw عن 10,000 تسجيل لمشغّلات self-hosted كل 5 دقائق في `ghx api rate_limit`. أعد فحص `actions_runner_registration` قبل كل جولة ضبط لأن GitHub قد يغيّر هذه الحاوية. يتشارك الحد كل تسجيلات مشغّلات Blacksmith في مؤسسة `openclaw`، لذا فإن إضافة تثبيت Blacksmith آخر لا تضيف حاوية جديدة.

عامِل تسميات Blacksmith باعتبارها المورد النادر للتحكم في الاندفاع. ينبغي أن تبقى المهام التي تكتفي بالتوجيه أو الإشعار أو التلخيص أو اختيار الأجزاء أو تشغيل فحوصات CodeQL قصيرة على مشغّلات GitHub-hosted ما لم تكن لديها حاجات خاصة بـ Blacksmith ومقاسة. يجب أن تعرض أي مصفوفة Blacksmith جديدة، أو `max-parallel` أكبر، أو سير عمل عالي التكرار، عدد التسجيلات في أسوأ حالة وأن تبقي هدف مستوى المؤسسة دون نحو 60% من الحاوية الحية. مع حاوية التسجيلات الحالية البالغة 10,000، يعني ذلك هدف تشغيل قدره 6,000 تسجيل، مما يترك هامشاً للمستودعات المتزامنة وإعادة المحاولة وتداخل الاندفاع.

تحافظ CI في المستودع الأساسي على Blacksmith كمسار المشغّل الافتراضي لتشغيلات الدفع وطلبات السحب العادية. تستخدم تشغيلات `workflow_dispatch` وتشغيلات المستودعات غير الأساسية مشغّلات GitHub-hosted، لكن التشغيلات الأساسية العادية لا تتحقق حالياً من صحة طابور Blacksmith ولا تعود تلقائياً إلى تسميات GitHub-hosted عندما يكون Blacksmith غير متاح.

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

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة ومؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` المرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغل ثلاثة مسارات:

- `mock-provider`: سيناريوهات تشخيص Kova مقابل وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل CPU/heap/trace للنقاط الساخنة في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، يتم تخطيها عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغل مسار mock-provider أيضًا فحوصات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وRSS لاستيراد Plugin المجمّعة، وحلقات ترحيب mock-OpenAI `channel-chat-baseline` متكررة، وأوامر بدء CLI ضد Gateway الذي تم إقلاعه، وفحص أداء smoke لحالة SQLite. عندما يكون تقرير مصدر mock-provider السابق المنشور متاحًا للمرجع المختبَر، يقارن ملخص المصدر قيم RSS وheap الحالية مع ذلك الخط الأساس ويعلّم زيادات RSS الكبيرة بوصفها `watch`. يوجد ملخص Markdown لفحص المصدر في `source/index.md` داخل حزمة التقرير، وبجانبه JSON الخام.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأً، يثبت سير العمل أيضًا `report.json` و`report.md` والحزم و`index.md` وartifacts فحص المصدر في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي على هيئة `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع من أجل "تشغيل كل شيء قبل الإصدار." يقبل فرعًا أو وسمًا أو SHA التزام كاملًا، ويشغل سير عمل `CI` اليدوي بذلك الهدف، ويشغل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدارات فقط، ويشغل `OpenClaw Release Checks` لفحص تثبيت smoke، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة قياس النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تتضمن الملفات التعريفية stable وfull دائمًا تغطية شاملة live/E2E وsoak لمسار إصدار Docker؛ ويمكن للملف التعريفي beta الاشتراك عبر `run_release_soak=true`. يعمل E2E القانوني لحزمة Telegram داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل مستطلعًا live مكررًا. بعد النشر، مرّر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وDocker، وعبر أنظمة التشغيل، وTelegram من دون إعادة البناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة live الخاص بـ Codex plugin الحالة المحددة نفسها افتراضيًا: `release_package_spec=openclaw@<tag>` المنشور يستنتج `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تحزم تشغيلات SHA/artifact‏ `extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحةً لمصادر Plugin مخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، وفروق الملفات التعريفية، وartifacts، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُحدث تغييرات. شغّله
من `release/YYYY.M.PATCH` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويشغل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب نشر stable أيضًا
`windows_node_tag` مطابقًا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتاته x64/ARM64 مع إدخال
`windows_node_installer_digests` المعتمد للمرشح قبل أي فرع نشر، ثم يروّج
ويتحقق من ملخصات المثبت المثبتة نفسها بالإضافة إلى أصل المرافق المطابق
وعقد checksum قبل نشر مسودة إصدار GitHub.

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

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعًا أو وسومًا، وليست SHA التزام خامًا. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويشغل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل المتحقق الجامع أيضًا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/provider الذي يُمرر إلى فحوصات الإصدار. تضبط
سير عمل الإصدار اليدوية القيمة الافتراضية إلى `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة provider/media الاستشارية الواسعة. تشغل فحوصات إصدار stable وfull
دائمًا تغطية live/E2E الشاملة وsoak لمسار إصدار Docker؛
ويمكن للملف التعريفي beta الاشتراك عبر `run_release_soak=true`.

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة provider/backend المستقرة.
- يشغل `full` مصفوفة provider/media الاستشارية الواسعة.

يسجل الجامع معرّفات التشغيل الفرعية التي تم تشغيلها، وتعيد وظيفة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتضيف جداول أبطأ الوظائف لكل تشغيل فرعي. إذا أُعيد تشغيل سير عمل فرعي وتحول إلى أخضر، فأعد تشغيل وظيفة المتحقق الأصل فقط لتحديث نتيجة الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، أو `ci` للفرع الفرعي CI الكامل العادي فقط، أو `plugin-prerelease` لفرع Plugin prerelease فقط، أو `release-checks` لكل فرع إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الجامع. يبقي هذا إعادة تشغيل مربع إصدار فاشل محدودة بعد إصلاح مركز. لمسار cross-OS واحد فاشل، ادمج `rerun_group=cross-os` مع `cross_os_suite_filter`، مثل `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات فحوصات إصدار QA استشارية باستثناء بوابة تغطية أداة وقت التشغيل القياسية، التي تمنع عندما تنحرف أدوات OpenClaw الديناميكية المطلوبة أو تختفي من ملخص المستوى القياسي.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك artifact إلى فحوصات cross-OS وPackage Acceptance، بالإضافة إلى سير عمل Docker لمسار الإصدار live/E2E عندما تعمل تغطية soak. يحافظ ذلك على اتساق بايتات الحزمة عبر مربعات الإصدار ويتجنب إعادة حزم المرشح نفسه في وظائف فرعية متعددة. لمسار live الخاص بـ Codex npm-plugin، إما أن تمرر فحوصات الإصدار مواصفة Plugin منشورة مطابقة مستنتجة من `release_package_spec`، أو تمرر `codex_plugin_spec` المقدمة من المشغل، أو تترك الإدخال فارغًا ليحزم سكربت Docker‏ Codex plugin من checkout المحدد.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تستبدل الجامع الأقدم. يلغي مراقب الأصل أي سير عمل فرعي
كان قد شغله عندما يُلغى الأصل، لذلك لا يبقى تحقق main الأحدث
خلف تشغيل release-check قديم لمدة ساعتين. تحتفظ عمليات تحقق فرع/وسم الإصدار
ومجموعات إعادة التشغيل المركزة بـ `cancel-in-progress: false`.

## شظايا Live وE2E

يحافظ فرع live/E2E للإصدار على تغطية `pnpm test:live` أصلية واسعة، لكنه يشغلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلًا من وظيفة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- وظائف `native-live-src-gateway-profiles` المفلترة حسب provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شظايا audio/video للوسائط وشظايا music المفلترة حسب provider

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات provider live البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الشظايا الإجمالية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادة التشغيل اليدوية لمرة واحدة.

تعمل شظايا وسائط live الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبني بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة `ffmpeg` و`ffprobe` مسبقًا؛ ولا تتحقق وظائف الوسائط إلا من الثنائيات قبل الإعداد. أبقِ مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية — فوظائف الحاويات ليست المكان الصحيح لإطلاق اختبارات Docker متداخلة.

تستخدم أجزاء النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تنفيذ محدد. يبني مسار عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المقسّم حسب المزوّد، وخلفية CLI، وربط ACP، وأجزاء حزمة Codex باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway في Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة مسار العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلاً من استهلاك ميزانية فحص الإصدار بالكامل. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقت التنفيذ على عمليات بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو: "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: إذ يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من ملف tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` المرجع `workflow_ref`، ويحل مرشح حزمة واحداً، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما معاً كأثر `package-under-test`، ويطبع المصدر ومرجع مسار العمل ومرجع الحزمة والإصدار وSHA-256 والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل مسار العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون ملف tarball، ويحضّر صور Docker ذات ملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلاً من حزم نسخة مسار العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يحضّر مسار العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية ذات آثار فريدة.
3. يستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none`، ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحداً؛ ويمكن لإرسال Telegram المستقل أن يظل يثبت مواصفة npm منشورة.
4. يفشل `summary` مسار العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعاً أو وسماً أو SHA تنفيذ كاملاً موثوقاً في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التنفيذ المحدد يمكن الوصول إليه من تاريخ فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عاماً عبر HTTPS؛ ويكون `package_sha256` مطلوباً. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو عناوين IP المحلولة الخاصة/الداخلية/ذات الاستخدام الخاص، وعمليات إعادة التوجيه إلى خارج سياسة السلامة العامة نفسها.
- ينزّل `source=trusted-url` ملف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ ويكون `package_sha256` و`trusted_source_id` مطلوبين. استخدم هذا فقط لمرايا المؤسسات المملوكة للمشرفين أو مستودعات الحزم الخاصة التي تحتاج إلى مضيفين أو منافذ أو بادئات مسارات أو مضيفي إعادة توجيه أو تحليل شبكة خاصة مهيأة. إذا أعلنت السياسة مصادقة bearer، يستخدم مسار العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ ولا تزال بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزّل `source=artifact` ملف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختيارياً، لكن ينبغي توفيره للآثار المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود مسار العمل/حزمة الاختبار الموثوق الذي يشغل الاختبار. `package_ref` هو تنفيذ المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من تنفيذات مصدر موثوقة أقدم من دون تشغيل منطق مسار عمل قديم.

### ملفات تعريف الحزمة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكامل مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية Plugin دون اتصال حتى لا يكون التحقق من الحزمة المنشورة مشروطاً بتوفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

للسياسة المخصصة لاختبار التحديث وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة باستخدام `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يحافظ هذا على إثبات ترحيل الحزمة، والتحديث، وتثبيت Skill من ClawHub الحي، وتنظيف تبعيات Plugin القديمة، وإصلاح تثبيت Plugin المهيأ، وPlugin دون اتصال، وتحديث Plugin، وTelegram على ملف tarball نفسه للحزمة المحلولة. اضبط `release_package_spec` في Full Release Validation أو OpenClaw Release Checks بعد نشر إصدار beta لتشغيل المصفوفة نفسها ضد حزمة npm المشحونة دون إعادة بناء؛ واضبط `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. لا تزال فحوصات الإصدار العابرة لأنظمة التشغيل تغطي سلوك الإعداد الأولي والمثبت والمنصة الخاص بكل نظام تشغيل؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة لكل تشغيل في مسار الإصدار الحاجب. في قبول الحزمة، يكون ملف tarball المحلول `package-under-test` هو المرشح دائماً، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع الافتراضي `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يضبط Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمة `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة بالإضافة إلى إصدارات حدود توافق Plugin المثبتة ومثبتات على شكل مشكلات لإعداد Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المهيأة، ومسارات سجلات tilde، وجذور تبعيات Plugin القديمة الراكدة. تُجزّأ تحديدات ناجي الترقية المنشورة متعددة الخطوط الأساسية حسب الخط الأساسي إلى مهام مشغل Docker مستهدفة منفصلة. يستخدم مسار العمل المنفصل `Update Migration` مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو التنظيف الشامل للتحديثات المنشورة، وليس اتساع CI العادي الكامل للإصدار. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يهيئ المسار المنشور الخط الأساسي بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق أيضاً مسارات Windows الطازجة للحزمة والمثبت من أن الحزمة المثبتة يمكنها استيراد تجاوز للتحكم في المتصفح من مسار Windows مطلق خام. يعتمد اختبار دخاني لدورة وكيل OpenAI عبر أنظمة التشغيل افتراضياً على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا على `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديمة

لدى قبول الحزمة نوافذ توافق قديمة محدودة للحزم المنشورة مسبقاً. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرار `gateway install --wrapper` عندما لا تكشف الحزمة ذلك العلم؛
- قد يقلّم `update-channel-switch` عناصر pnpm `patchedDependencies` المفقودة من مثبت git الوهمي المشتق من tarball، وقد يسجل `update.channel` محفوظاً مفقوداً؛
- قد تقرأ اختبارات Plugin الدخانية مواقع سجلات تثبيت قديمة أو تقبل غياب استمرار سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضاً من ملفات وسم بيانات تعريف البناء المحلي التي كانت قد شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلاً من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثاره في Docker: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار تثبيت دخاني

يعيد مسار العمل المنفصل `Install Smoke` استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الاختبار الدخاني إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يعمل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/package، أو تغييرات package/manifest الخاصة بـ Plugin المضمّن، أو أسطح Plugin SDK/core plugin/channel/gateway التي تمرّنها مهام Docker smoke. لا تحجز تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات التوثيق فقط، عاملي Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل فحص smoke لـ CLI الخاص بحذف agents لمساحة العمل المشتركة، ويشغّل اختبار gateway-network e2e للحاوية، ويتحقق من وسيطة بناء لإضافة مضمّنة، ويشغّل ملف Docker التعريفي المحدود لـ bundled-plugin ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تقييد تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتغطية تثبيت QR package وDocker/update الخاص بالمثبّت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعليا أسطح installer/package/Docker. في الوضع الكامل، يجهّز install-smoke صورة فحص smoke واحدة لـ Dockerfile الجذري من GHCR للـ target-SHA أو يعيد استخدامها، ثم يشغّل تثبيت QR package، وفحوصات smoke لـ Dockerfile/gateway الجذرية، وفحوصات smoke للمثبّت/التحديث، واختبار Docker E2E السريع لـ bundled-plugin كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف فحوصات smoke للصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك merge commits) المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند push، يحافظ سير العمل على فحص Docker smoke السريع ويترك فحص التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يُحرس فحص smoke البطيء لمزوّد الصورة عبر تثبيت Bun العالمي بشكل منفصل بواسطة `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات التشغيل اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. لا يزال CI العادي لطلبات السحب يشغّل مسار انحدار مشغّل Bun السريع للتغييرات المتعلقة بـ Node. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile المخصصة للتثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة live-test مشتركة مسبقا، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات التجمع الرئيسي للمسارات العادية.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات تجمع الذيل الحساس للمزوّد.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات الحية المتزامنة حتى لا تفرض المزوّدات الخنق.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | حد مسارات تثبيت npm المتزامنة.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد المسارات المتزامنة متعددة الخدمات.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | تدرّج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ عيّن `0` لعدم استخدام التدرّج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات live/tail المحددة حدودا أضيق.              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معيّن | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معيّن | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز فحص smoke للتنظيف حتى يمكن للوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعّال أن يبدأ رغم ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تتحقق التجميعة المحلية مسبقا من Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحتفظ بتوقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمّعة جديدة بعد أول فشل.

### سير عمل live/E2E قابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن package، ونوع الصورة، وصورة live، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر package من التشغيل الحالي، أو ينزّل أثر package من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية من GHCR الموسومة ببصمة package عبر ذاكرة طبقات Docker المؤقتة الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة من package؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور بصمة package الموجودة بدلا من إعادة البناء. يعاد حاول سحب صور Docker مع مهلة محدودة قدرها 180 ثانية لكل محاولة، حتى يعاد حاول تدفق registry/cache العالق بسرعة بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مجزأة أصغر مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفّذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` ومن `plugins-runtime-install-a` إلى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار package الحي لـ Codex plugin، الذي يثبّت package المرشحة لـ OpenClaw، ويثبّت Codex plugin من `codex_plugin_spec` أو tarball من المرجع نفسه مع موافقة صريحة على تثبيت Codex CLI، ويشغّل فحص Codex CLI المسبق، ثم يشغّل عدة دورات OpenClaw agent في الجلسة نفسها مقابل OpenAI. تظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية لـ plugin/runtime. يظل الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبّت المزوّد.

يُضم OpenWebUI داخل `plugins-runtime-services` عندما تطلبه تغطية release-path الكاملة، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات التشغيل الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة لإخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المجهزة بدلا من مهام الأجزاء، مما يجعل تصحيح مسار فاشل محدودا بمهمة Docker واحدة مستهدفة ويجهّز أثر package أو ينزّله أو يعيد استخدامه لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker حيا، تبني المهمة المستهدفة صورة live-test محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل التي ينشئها GitHub لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المجهزة عندما توجد تلك القيم، بحيث يمكن لمسار فاشل إعادة استخدام package والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية product/package أعلى كلفة، لذلك فهو سير عمل منفصل يُشغّل بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات تشغيل CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال للإضافات؛ وتشغّل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي إعدادات Plugin في وقت واحد مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker prerelease الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام تستغرق دقيقة إلى ثلاث دقائق. يرفع سير العمل أيضا أثرا معلوماتيا باسم `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ نتائج المفتش مدخلات فرز ولا تغيّر بوابة Plugin Prerelease الحاجزة.

## QA Lab

لدى QA Lab مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل تحت حزم QA الواسعة وحزم الإصدار، وليس سير عمل مستقل لطلب السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يسير التكافؤ مع تشغيل تحقق واسع.

- يشغّل سير العمل `QA-Lab - All Lanes` ليليا على `main` وعند التشغيل اليدوي؛ ويفرّع مسار تكافؤ المحاكاة، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram مع مزوّد المحاكاة الحتمي والنماذج المؤهلة للمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل provider-plugin العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال المزوّد مجموعات النموذج الحي، والمزوّد الأصلي، ومزوّد Docker المنفصلة.

يستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI المحدد. يظل افتراضي CLI ومدخل سير العمل اليدوي `all`؛ ويفرّع تشغيل `matrix_profile=all` اليدوي دائما تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزمتَي المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحوصات المحددة النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو عمدا ماسح أمني ضيق للمرور الأول، وليس مسحا كاملا للمستودع. تفحص عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة شيفرة سير عمل Actions إلى جانب أسطح JavaScript/TypeScript الأعلى خطرا باستخدام استعلامات أمنية عالية الثقة مرشحة إلى `security-severity` العالية/الحرجة.

يبقى حارس طلب السحب خفيفا: يبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. تبقى Android وmacOS CodeQL خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                           | السطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط أساس المصادقة والأسرار وبيئة العزل وcron وgateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة في النواة، إضافة إلى تشغيل Plugin القناة وgateway وPlugin SDK والأسرار ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF في النواة، وتحليل IP، وحارس الشبكة، وجلب الويب، وPlugin SDK SSRF                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP ومساعدات تنفيذ العمليات والتسليم الصادر وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin والمحمّل والبيان والسجل وتثبيت مدير الحزم وتحميل المصدر وعقد حزمة Plugin SDK |

### شظايا الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويا من أجل CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا من أجل CodeQL على Blacksmith macOS، وتصفّي نتائج بناء التبعيات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. تبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية المقابلة غير الأمنية. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغّلات Linux المستضافة على GitHub حتى لا تستهلك فحوصات الجودة ميزانية تسجيل مشغّلات Blacksmith. حارس طلب السحب الخاص بها أصغر عمدا من ملف التعريف المجدول: طلبات السحب غير المسودة تشغّل فقط شظايا `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوجيه الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/بيئة العزل/الأمان، وتشغيل القناة في النواة وPlugin القناة المضمّن، وبروتوكول gateway/طريقة الخادم، وتشغيل الذاكرة/وصلات SDK، وMCP/العمليات/التسليم الصادر، وتشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/صفوف التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو تشغيل ردود Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغّل كل شظايا جودة طلبات السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وبيئة العزل وcron وgateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات والترحيل والتطبيع والإدخال والإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ قناة النواة وPlugin القناة المضمّن                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود تشغيل تنفيذ الأوامر، وتوجيه النموذج/المزوّد، وتوجيه الرد التلقائي والصفوف، ومستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، وواجهات تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، ووصلات تفعيل تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات صف الردود، وصفوف تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/تشغيل الردود، وخيارات رد القنوات، وصفوف التسليم، ومساعدات ربط الجلسات/الخيوط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل تشغيل المزوّد، وافتراضيات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم gateway، وعقود تشغيل مستوى تحكم المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود تشغيل جلب/بحث الويب في النواة، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور على جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython والـ Plugin المضمّنة كعمل متابعة محدد النطاق أو مشظّى فقط بعد أن تصبح ملفات التعريف الضيقة مستقرة في زمن التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex محكوم بالأحداث لإبقاء المستندات الموجودة متوافقة مع التغييرات التي هبطت مؤخرا. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح غير صادر عن بوت بعد دفع إلى `main` أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أُنشئ في الساعة الأخيرة. عندما يعمل، يراجع نطاق الالتزامات من SHA مصدر `Docs Agent` السابق غير المتخطى إلى `main` الحالي، بحيث يمكن لتشغيل ساعي واحد أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex محكوم بالأحداث للاختبارات البطيئة. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح غير صادر عن بوت بعد دفع إلى `main` أن يطلقه، لكنه يتخطى إذا كان استدعاء آخر لتشغيل سير العمل قد عمل أو يعمل بالفعل في ذلك اليوم بتوقيت UTC. التشغيل اليدوي يتجاوز بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمع زمن الجدار لكل إعداد والحد الأقصى لـ RSS على Linux وmacOS، بحيث تعرض مقارنة قبل/بعد فروق ذاكرة الاختبار إلى جانب فروق المدة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل إيداع أي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس الرقعة التي تم التحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يستطيع إجراء Codex الحفاظ على وضع السلامة نفسه الخاص بإسقاط sudo مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف النسخ المكررة بعد الهبوط. يضبط افتراضيا على التشغيل الجاف ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدموج وأن كل نسخة مكررة لديها إما مشكلة مرجعية مشتركة أو مقاطع تغيير متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أشد صرامة بشأن حدود المعمارية من النطاق الواسع لمنصة CI:

- تغييرات إنتاج النواة تشغّل فحص أنواع إنتاج النواة واختبارات النواة إضافة إلى lint/guards للنواة؛
- تغييرات الاختبارات فقط في النواة تشغّل فقط فحص أنواع اختبارات النواة إضافة إلى lint للنواة؛
- تغييرات إنتاج الإضافات تشغّل فحص أنواع إنتاج الإضافات واختباراتها إضافة إلى lint للإضافات؛
- تغييرات الاختبارات فقط في الإضافات تشغّل فحص أنواع اختبارات الإضافات إضافة إلى lint للإضافات؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود النواة تلك (تبقى مسوحات امتدادات Vitest عملا اختباريا صريحا)؛
- رفع أرقام الإصدارات الخاص ببيانات الإصدار فقط يشغّل فحوصات موجهة للإصدار/الإعدادات/تبعية الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

تعيش عملية توجيه الاختبارات المتغيرة المحلية في `scripts/test-projects.test-support.mjs` وهي أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتعديلات المصدر تفضّل الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. إعداد تسليم غرف المجموعة المشتركة هو أحد الخرائط الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل تمر عبر اختبارات رد النواة إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا بما يكفي على مستوى الحزمة الاختبارية بحيث لا تكون المجموعة الرخيصة المرسومة وكيلا موثوقا.

## تحقق Testbox

Crabbox هو مغلّف الصندوق البعيد المملوك للمستودع لإثبات Linux للمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص أوسع من حلقة تعديل محلية، أو عندما يهم
تكافؤ CI، أو عندما يحتاج الإثبات إلى أسرار أو Docker أو مسارات حزم أو
صناديق قابلة لإعادة الاستخدام أو سجلات بعيدة. واجهة OpenClaw الخلفية العادية هي
`blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة بديلا احتياطيا عند انقطاعات Blacksmith
أو مشكلات الحصة أو اختبارات السعة المملوكة الصريحة.

تعمل عمليات Blacksmith المدعومة بـ Crabbox على تهيئة Testboxes، وحجزها، ومزامنتها، وتشغيلها، والإبلاغ عنها، وتنظيفها
كعمليات لمرة واحدة. يفشل فحص سلامة المزامنة المدمج بسرعة عندما تختفي ملفات الجذر المطلوبة
مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short`
ما لا يقل عن 200 عملية حذف متتبعة. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI المحلي الذي يبقى في
مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالميلي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملف Crabbox الثنائي القديم الذي لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً رغم أن `.crabbox.yaml` يحتوي على الإعدادات الافتراضية للسحابة المملوكة. في أشجار عمل Codex أو checkouts المرتبطة/المتناثرة، تجنب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يوفق التبعيات قبل بدء Crabbox؛ استدعِ غلاف node مباشرةً بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب عمليات التشغيل المدعومة بـ Blacksmith إصدار Crabbox 0.22.0 أو أحدث حتى يحصل الغلاف على سلوك مزامنة Testbox، والطابور، والتنظيف الحالي. عند استخدام checkout الشقيق، أعد بناء الملف الثنائي المحلي المتجاهل قبل أعمال التوقيت أو الإثبات:

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider`، و`leaseId`،
و`syncDelegated`، و`exitCode`، و`commandMs`، و`totalMs`. بالنسبة إلى عمليات
Blacksmith Testbox المفوضة، يكون رمز خروج غلاف Crabbox وملخص JSON هما
نتيجة الأمر. تمتلك عملية GitHub Actions المرتبطة التهيئة وkeepalive؛ وقد
تنتهي بحالة `cancelled` عندما يتم إيقاف Testbox خارجيًا بعد أن يكون أمر SSH
قد عاد بالفعل. تعامل مع ذلك على أنه أثر تنظيف/حالة ما لم يكن
`exitCode` الخاص بالغلاف غير صفري أو تُظهر مخرجات الأمر اختبارًا فاشلًا.
يجب أن توقف عمليات Crabbox لمرة واحدة والمدعومة بـ Blacksmith الـ Testbox تلقائيًا؛
إذا انقطعت عملية تشغيل أو كان التنظيف غير واضح، افحص الصناديق الحية وأوقف فقط
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
Blacksmith المباشر فقط للتشخيص مثل `list`، و`status`، والتنظيف. أصلح مسار
Crabbox قبل اعتبار تشغيل Blacksmith مباشر إثباتًا للمشرف.

إذا كان `blacksmith testbox list --all` و`blacksmith testbox status` يعملان لكن عمليات
التهيئة الجديدة تبقى `queued` من دون IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فتعامل مع ذلك كضغط على مزوّد Blacksmith أو الطابور أو الفوترة أو حدود المؤسسة. أوقف
المعرفات الموجودة في الطابور التي أنشأتها، وتجنب بدء المزيد من Testboxes، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص شخص ما لوحة معلومات Blacksmith،
والفوترة، وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متعطلًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` من 192 vCPU وهو أسهل طريقة للاصطدام بحصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تعيّن `.crabbox.yaml` المملوكة للمستودع الإعدادات الافتراضية إلى `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع عقود AWS المتوسطة المنطقة/السوق المحددة، وضغط الحصة، والرجوع إلى Spot، وتحذيرات فئة الضغط العالي. استخدم `fast` للفحوص العامة الأثقل، و`large` فقط بعد أن لا يعود standard/fast كافيين، و`beast` فقط للمسارات الاستثنائية المعتمدة على CPU مثل المجموعة الكاملة أو مصفوفات Docker لكل Plugin، أو تحقق الإصدار/الحظر الصريح، أو توصيف الأداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed`، أو الاختبارات المركزة، أو العمل الخاص بالوثائق فقط، أو lint/typecheck العادي، أو عمليات إعادة إنتاج E2E الصغيرة، أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا تختلط تقلبات سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` الإعدادات الافتراضية للمزوّد، والمزامنة، وتهيئة GitHub Actions لمسارات السحابة المملوكة. تستثني `.git` المحلي حتى يحتفظ checkout المهيأ في Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة المحلية للمشرف ومخازن الكائنات، وتستثني آثار التشغيل/البناء المحلية التي لا ينبغي نقلها أبدًا. تمتلك `.github/workflows/crabbox-hydrate.yml` عملية checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

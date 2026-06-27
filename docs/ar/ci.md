---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها.
    - أنت تصحّح فحص GitHub Actions فاشل
    - أنت تنسق تشغيل تحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر توجيه ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-06-27T17:16:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

تعمل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تمر دفعات `main`
القياسية أولا عبر نافذة قبول hosted-runner مدتها 90 ثانية. تلغي مجموعة التزامن
`CI` الحالية ذلك التشغيل المنتظر عند وصول commit أحدث، لذلك لا تسجل عمليات الدمج
المتتابعة كل واحدة منها مصفوفة Blacksmith كاملة. تتجاوز طلبات السحب وعمليات
التشغيل اليدوية الانتظار. بعد ذلك تصنف مهمة `preflight` الفرق وتوقف المسارات
المكلفة عندما تكون المناطق غير ذات الصلة فقط قد تغيرت. تتجاوز عمليات
`workflow_dispatch` اليدوية عمدا تحديد النطاق الذكي وتوسع الرسم البياني كاملا
لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر
`include_android`. تعيش تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل
[`ما قبل إصدار Plugin`](#plugin-prerelease) ولا تعمل إلا من
[`التحقق الكامل من الإصدار`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                            | الغرض                                                                                                         | متى تعمل                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                       | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                            | دائما على الدفعات وطلبات السحب غير المسودة           |
| `runner-admission`                | تهدئة hosted لمدة 90 ثانية لدفعات `main` القياسية قبل تسجيل عمل Blacksmith                                   | كل تشغيل CI؛ السكون فقط على دفعات `main` القياسية    |
| `security-fast`                   | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل المتغير عبر `zizmor`، وتدقيق lockfile الإنتاج                       | دائما على الدفعات وطلبات السحب غير المسودة           |
| `check-dependencies`              | تمريرة Knip الإنتاجية الخاصة بالاعتمادات فقط بالإضافة إلى حارس قائمة السماح للملفات غير المستخدمة            | تغييرات ذات صلة بـ Node                              |
| `build-artifacts`                 | بناء `dist/`، وControl UI، وفحوص smoke للـ CLI المبني، وفحوص الآثار المبنية المضمنة، والآثار القابلة لإعادة الاستخدام | تغييرات ذات صلة بـ Node                              |
| `checks-fast-core`                | مسارات صحة Linux السريعة مثل bundled وprotocol وQA Smoke CI وفحوص توجيه CI                                   | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-plugins-*` | فحصا عقود Plugin مقسمان إلى شظايا                                                                            | تغييرات ذات صلة بـ Node                              |
| `checks-fast-contracts-channels-*` | فحصا عقود القنوات مقسمان إلى شظايا                                                                          | تغييرات ذات صلة بـ Node                              |
| `checks-node-core-*`              | شظايا اختبارات Node الأساسية، مع استثناء مسارات القناة وbundled والعقود والإضافات                            | تغييرات ذات صلة بـ Node                              |
| `check-*`                         | المكافئ المقسم إلى شظايا للبوابة المحلية الرئيسية: أنواع الإنتاج، وlint، والحراس، وأنواع الاختبار، وsmoke صارم | تغييرات ذات صلة بـ Node                              |
| `check-additional-*`              | البنية، وانحراف boundary/prompt المقسم إلى شظايا، وحراس الإضافات، وحدود الحزم، وطوبولوجيا وقت التشغيل        | تغييرات ذات صلة بـ Node                              |
| `checks-node-compat-node22`        | بناء توافق Node 22 ومسار smoke                                                                               | تشغيل CI يدوي للإصدارات                              |
| `check-docs`                      | تنسيق الوثائق وlint وفحوص الروابط المعطلة                                                                    | عند تغير الوثائق                                     |
| `skills-python`                   | Ruff + pytest للـ Skills المدعومة بـ Python                                                                  | تغييرات ذات صلة بـ Python-skill                      |
| `checks-windows`                  | اختبارات العملية/المسار الخاصة بـ Windows بالإضافة إلى ارتدادات محددات استيراد وقت التشغيل المشتركة          | تغييرات ذات صلة بـ Windows                           |
| `macos-node`                      | مسار اختبار TypeScript على macOS باستخدام الآثار المبنية المشتركة                                            | تغييرات ذات صلة بـ macOS                             |
| `macos-swift`                     | Swift lint والبناء والاختبارات لتطبيق macOS                                                                  | تغييرات ذات صلة بـ macOS                             |
| `ios-build`                       | توليد مشروع Xcode بالإضافة إلى بناء محاكي تطبيق iOS                                                          | تطبيق iOS أو shared app kit أو تغييرات Swabble       |
| `android`                         | اختبارات وحدة Android لكلا النكهتين بالإضافة إلى بناء debug APK واحد                                         | تغييرات ذات صلة بـ Android                           |
| `test-performance-agent`          | تحسين اختبارات Codex البطيئة يوميا بعد نشاط موثوق                                                            | نجاح CI الرئيسي أو تشغيل يدوي                        |
| `openclaw-performance`            | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات mock-provider وdeep-profile وGPT 5.5 live             | مجدول وتشغيل يدوي                                    |

## ترتيب الفشل السريع

1. ينتظر `runner-admission` فقط لدفعات `main` القياسية؛ تلغي دفعة أحدث التشغيل قبل تسجيل Blacksmith.
2. يقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليست مهام مستقلة.
3. تفشل `security-fast` و`check-*` و`check-additional-*` و`check-docs` و`skills-python` بسرعة دون انتظار مهام الآثار ومصفوفة المنصات الأثقل.
4. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يستطيع المستهلكون اللاحقون البدء بمجرد جاهزية البناء المشترك.
5. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-plugins-*` و`checks-fast-contracts-channels-*` و`checks-node-core-*` و`checks-windows` و`macos-node` و`macos-swift` و`ios-build` و`android`.

قد تضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عند وصول دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم مهام المصفوفة `fail-fast: false`، ويبلغ `build-artifacts` عن فشل embedded channel وcore-support-boundary وgateway-watch مباشرة بدلا من صف مهام تحقق صغيرة. مفتاح تزامن CI التلقائي مهيأ بإصدار (`CI-v7-*`) حتى لا يستطيع zombie على جانب GitHub في مجموعة صف قديمة حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

استخدم `pnpm ci:timings` أو `pnpm ci:timings:recent` أو `node scripts/ci-run-timings.mjs <run-id>` لتلخيص زمن الجدار، ووقت الصف، وأبطأ المهام، والإخفاقات، وحاجز توسع `pnpm-store-warmup` من GitHub Actions. ترفع CI أيضا ملخص التشغيل نفسه كأثر `ci-timings-summary`. لتوقيت البناء، راجع خطوة `Build dist` في مهمة `build-artifacts`: يطبع `pnpm build:ci-artifacts` السطر `[build-all] phase timings:` ويتضمن `ui:build`؛ وترفع المهمة أيضا أثر `startup-memory`.

بالنسبة إلى تشغيلات طلبات السحب، تعمل مهمة timing-summary الطرفية على تشغيل المساعد من مراجعة القاعدة الموثوقة قبل تمرير `GH_TOKEN` إلى `gh run view`. يحافظ ذلك على الاستعلام ذي الرمز المميز خارج الشيفرة التي يتحكم بها الفرع مع الاستمرار في تلخيص تشغيل CI الحالي لطلب السحب.

## سياق PR والأدلة

تشغل طلبات السحب من المساهمين الخارجيين بوابة سياق PR والأدلة من
`.github/workflows/real-behavior-proof.yml`. يفحص سير العمل commit القاعدة
الموثوق ويقيم نص طلب السحب فقط؛ ولا ينفذ شيفرة من فرع المساهم.

تنطبق البوابة على مؤلفي طلبات السحب الذين ليسوا ملاكا أو أعضاء أو متعاونين أو bots في المستودع. تنجح عندما يحتوي نص طلب السحب على قسمي
`What Problem This Solves` و`Evidence` من تأليف صاحبه. يمكن أن تكون الأدلة اختبارا مركزا، أو نتيجة CI، أو لقطة شاشة، أو تسجيلا، أو مخرجات طرفية، أو ملاحظة مباشرة، أو سجلا منقحا، أو رابط أثر. يوفر النص القصد والتحقق المفيد؛ ويفحص المراجعون الشيفرة والاختبارات وCI لتقييم الصحة.

عند فشل الفحص، حدّث نص طلب السحب بدلا من دفع commit شيفرة آخر.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف changed-scope ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم Node CI البياني بالإضافة إلى lint لسير العمل، لكنها لا تفرض بمفردها بناءات Windows أو iOS أو Android أو macOS الأصلية؛ تبقى مسارات المنصات هذه محددة النطاق لتغييرات مصدر المنصة.
- **Workflow Sanity** يشغل `actionlint` و`zizmor` على جميع ملفات YAML لسير العمل، وحارس interpolation للإجراء المركب، وحارس علامات التعارض. تشغل مهمة `security-fast` المحددة بنطاق PR أيضا `zizmor` على ملفات سير العمل المتغيرة حتى تفشل نتائج أمان سير العمل مبكرا في رسم CI الرئيسي.
- **الوثائق على دفعات `main`** يفحصها سير العمل المستقل `Docs` باستخدام مرآة وثائق ClawHub نفسها التي تستخدمها CI، لذلك لا تضيف دفعات code+docs المختلطة شظية `check-docs` الخاصة بـ CI إلى الصف أيضا. لا تزال طلبات السحب وCI اليدوية تشغل `check-docs` من CI عند تغير الوثائق.
- **TUI PTY** يعمل في شظية Linux Node المسماة `checks-node-core-runtime-tui-pty` لتغييرات TUI. تشغل الشظية `test/vitest/vitest.tui-pty.config.ts` مع `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`، لذلك تغطي كلا من مسار أداة `TuiBackend` الحتمية وsmoke الأبطأ `tui --local` الذي يحاكي نقطة نهاية النموذج الخارجية فقط.
- **تعديلات توجيه CI فقط، وتعديلات أدوات اختبارات core-test الرخيصة المحددة، وتعديلات مساعدي/توجيه اختبارات عقود Plugin الضيقة** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، والشظايا الأساسية الكاملة، وشظايا bundled-plugin، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- **فحوص Windows Node** محددة النطاق إلى مغلفات العملية/المسار الخاصة بـ Windows، ومساعدي npm/pnpm/UI runner، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin وinstall-smoke والاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تُقسَّم أو تُوازَن أبطأ عائلات اختبارات Node بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغّلات: تعمل عقود Plugin وعقود القنوات كجزأين موزونين مدعومين من Blacksmith لكل منهما مع الرجوع القياسي إلى مشغّل GitHub، وتعمل مسارات وحدة النواة السريعة/الداعمة بشكل منفصل، وتُقسَّم بنية وقت تشغيل النواة بين الحالة، والعملية/الإعدادات، والمشترك، وثلاثة أجزاء نطاق Cron، ويعمل الرد التلقائي كعمّال موزونين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner، وdispatch، وcommands/state-routing)، وتُقسَّم إعدادات gateway/server الوكيلة عبر مسارات chat/auth/model/http-plugin/runtime/startup بدل انتظار artifacts المبنية. بعد ذلك تحزم CI العادية فقط أجزاء أنماط التضمين المعزولة للبنية التحتية في حزم حتمية بحد أقصى 64 ملف اختبار، مما يقلل مصفوفة Node من دون دمج مجموعات command/cron غير المعزولة، أو agents-core ذات الحالة، أو gateway/server؛ وتبقى المجموعات الثابتة الثقيلة على 8 vCPU بينما تستخدم المسارات المجمعة والأخف وزنًا 4 vCPU. تستخدم طلبات السحب على المستودع المعياري خطة قبول مدمجة إضافية: تعمل مجموعات الإعداد نفسها، لكل إعداد، في عمليات فرعية معزولة داخل خطة Linux Node الحالية المكوّنة من 34 مهمة، بحيث لا يسجل طلب سحب واحد مصفوفة Node الكاملة التي تتجاوز 70 مهمة. تحتفظ دفعات `main`، وعمليات الإرسال اليدوية، وبوابات الإصدار بالمصفوفة الكاملة. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدل التجميع العام المشترك لـ Plugin. تسجل أجزاء أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مُرشّح. يُبقي `check-additional-*` عمل الترجمة/الكناري الخاص بحدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ وتُقسَّم قائمة حراس الحدود إلى جزء كثيف المطالبات وجزء مدمج واحد لبقية شرائط الحراسة، حيث يشغّل كل منهما حراسًا مستقلين محددين بالتوازي ويطبع توقيتات كل فحص. يعمل فحص انحراف لقطة المطالبة لمسار Codex السعيد المكلف كمهمة إضافية مستقلة في CI اليدوية وللتغييرات المؤثرة في المطالبات فقط، بحيث لا تنتظر تغييرات Node العادية غير المرتبطة خلف إنشاء لقطات المطالبات الباردة وتبقى أجزاء الحدود متوازنة بينما يظل انحراف المطالبة مثبتًا بطلب السحب الذي سببه؛ وتتجاوز العلامة نفسها إنشاء Vitest للقطات المطالبات داخل جزء حدود دعم النواة الخاص بالـ artifact المبني. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم النواة بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

بعد القبول، تسمح CI المعيارية على Linux بما يصل إلى 24 مهمة اختبار Node متزامنة و12 للمسارات السريعة/الفحص الأصغر؛ وتبقى Windows وAndroid عند اثنتين لأن مجموعات مشغلاتهما أضيق.

تُصدر خطة طلبات السحب المدمجة 18 مهمة Node للمجموعة الحالية: تُجمّع مجموعات الإعداد الكاملة في عمليات فرعية معزولة مع مهلة دفعة قدرها 120 دقيقة، بينما تتشارك مجموعات أنماط التضمين ميزانية المهام المحدودة نفسها.

تشغّل CI الخاصة بـ Android كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم تبني APK تصحيح Play. لا تملك النكهة التابعة لجهة خارجية مجموعة مصادر أو manifest منفصلة؛ ولا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع علامات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف APK تصحيح مكررة في كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (مرور Knip للإنتاج خاص بالاعتماديات فقط ومثبت على أحدث إصدار Knip، مع تعطيل حد العمر الأدنى لإصدارات pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع أو يترك إدخال allowlist قديمًا، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبار الحي، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر على جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المسائل وطلبات السحب المحددة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المسائل؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام للمراقبة، وليس للتسليم افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو محفوفًا بالمخاطر، أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح الروتينية، والتحريرات، وضجيج الروبوتات، وضوضاء Webhook المكررة، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub، والتعليقات، والأجسام، ونصوص المراجعة، وأسماء الفروع، ورسائل الالتزام كبيانات غير موثوقة عبر هذا المسار كله. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## الإرسال اليدوي

تشغّل عمليات إرسال CI اليدوية مخطط المهام نفسه مثل CI العادية لكنها تفرض تشغيل كل مسار محدود النطاق غير Android: أجزاء Linux Node، وأجزاء Plugins المجمعة، وأجزاء عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات smoke للـ artifacts المبنية، وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وبناء iOS، وControl UI i18n. تشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستثنى من CI فحوصات Plugin الساكنة قبل الإصدار، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومسح دفعات الامتدادات الكامل، ومسارات Docker الخاصة بـ Plugin قبل الإصدار. تعمل مجموعة Docker قبل الإصدار فقط عندما يرسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى مجموعة كاملة لمرشح إصدار بسبب دفعة أو تشغيل طلب سحب آخر على المرجع نفسه. يسمح إدخال `target_ref` الاختياري لمستدع موثوق بتشغيل ذلك المخطط على فرع أو وسم أو SHA التزام كامل مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                          | المهام                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | إرسال CI اليدوي وبدائل المستودعات غير المعيارية، وفحوصات جودة CodeQL لـ JavaScript/actions، وworkflow-sanity، وlabeler، وauto-response، وسير عمل الوثائق خارج CI، وتمهيد install-smoke حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، و`security-fast`، وأجزاء الامتدادات الأخف وزنًا، و`checks-fast-core`، وأجزاء عقود Plugin/القنوات، ومعظم أجزاء Linux Node المجمعة/الأخف وزنًا، و`check-guards`، و`check-prod-types`، و`check-test-types`، وأجزاء محددة من `check-additional-*`، و`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعات Linux Node الثقيلة المحتفظ بها، وأجزاء `check-additional-*` الثقيلة من ناحية الحدود/الامتدادات، و`android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، و`check-lint` (حساس للـ CPU بما يكفي لأن 8 vCPU كلّفت أكثر مما وفرت)؛ وبناءات install-smoke Docker (وقت انتظار طابور 32-vCPU كلّف أكثر مما وفر)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` على `openclaw/openclaw`؛ تعود forks إلى `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و`ios-build` على `openclaw/openclaw`؛ تعود forks إلى `macos-26`                                                                                                                                                                                                  |

## ميزانية تسجيل المشغّلات

تسمح حاوية تسجيل مشغّلات GitHub الحالية الخاصة بـ OpenClaw بـ 3,000 تسجيل لمشغّلات ذاتية الاستضافة كل 5 دقائق. يُشارك الحد بين كل تسجيلات مشغلات Blacksmith في مؤسسة `openclaw`، لذلك لا تضيف عملية تثبيت Blacksmith أخرى حاوية جديدة.

تعامل مع تسميات Blacksmith بوصفها المورد النادر للتحكم في الاندفاع. يجب أن تبقى المهام التي لا تفعل سوى التوجيه، أو الإشعار، أو التلخيص، أو اختيار الأجزاء، أو تشغيل فحوصات CodeQL قصيرة على مشغلات GitHub المستضافة ما لم تكن لديها احتياجات خاصة بـ Blacksmith ومقاسة. يجب أن تُظهر أي مصفوفة Blacksmith جديدة، أو `max-parallel` أكبر، أو سير عمل عالي التكرار عدد التسجيلات في أسوأ الحالات وأن تبقي هدف مستوى المؤسسة دون 2,000 تسجيل كل 5 دقائق، مع ترك هامش للمستودعات المتزامنة والمهام المعاد تشغيلها.

تُبقي CI الخاصة بالمستودع المعياري Blacksmith كمسار المشغّل الافتراضي لتشغيلات الدفع وطلبات السحب العادية. تستخدم تشغيلات `workflow_dispatch` والمستودعات غير المعيارية مشغلات GitHub المستضافة، لكن التشغيلات المعيارية العادية لا تفحص حاليًا صحة طابور Blacksmith أو تعود تلقائيًا إلى تسميات GitHub المستضافة عندما لا يكون Blacksmith متاحًا.

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

يقيس التشغيل اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. يتم تمييز مسارات التقارير المنشورة ومؤشرات الأحدث حسب المرجع المختبر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليا بمصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: إنشاء ملفات تعريف CPU/الذاكرة heap/التتبع للنقاط الساخنة في بدء التشغيل وGateway ودورة الوكيل.
- `live-openai-candidate`: دورة وكيل OpenAI حقيقية `openai/gpt-5.5`، ويتم تخطيها عندما لا يكون `OPENAI_API_KEY` متاحا.

يشغل مسار mock-provider أيضا مجسات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، والخطاف، و50-Plugin؛ وRSS لاستيراد Plugin المضمنة، وحلقات ترحيب mock-OpenAI `channel-chat-baseline` المتكررة، وأوامر بدء CLI مقابل Gateway المشغل، ومجس أداء دخان حالة SQLite. عندما يكون تقرير مصدر mock-provider المنشور السابق متاحا للمرجع المختبر، يقارن ملخص المصدر قيم RSS والذاكرة heap الحالية بذلك الخط الأساسي ويضع علامة `watch` على زيادات RSS الكبيرة. يوجد ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، وبجانبه JSON الخام.

يرفع كل مسار عناصر GitHub الأثرية. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يثبت سير العمل أيضا `report.json` و`report.md` والحزم و`index.md` وعناصر مجسات المصدر الأثرية في `openclaw/clawgrit-reports` ضمن `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. تتم كتابة مؤشر المرجع المختبر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع لـ"تشغيل كل شيء قبل الإصدار." يقبل فرعا أو وسما أو SHA كاملا للالتزام، ويشغل سير العمل اليدوي `CI` بذلك الهدف، ويشغل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغل `OpenClaw Release Checks` لدخان التثبيت، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وعرض بطاقة قياس النضج من أدلة ملف QA التعريفي، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تتضمن ملفات stable وfull التعريفية دائما تغطية شاملة لمسارات live/E2E ومسار إصدار Docker الطويل؛ ويمكن لملف beta التعريفي الاشتراك عبر `run_release_soak=true`. يعمل E2E الحزمي القانوني لـ Telegram داخل Package Acceptance، لذلك لا يبدأ المرشح الكامل مستطلعا حيا مكررا. بعد النشر، مرر `release_package_spec` لإعادة استخدام حزمة npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وDocker، وعبر أنظمة التشغيل، وTelegram دون إعادة البناء. استخدم `npm_telegram_package_spec` فقط لإعادة تشغيل Telegram مركزة لحزمة منشورة. يستخدم مسار الحزمة الحية لـ Codex plugin الحالة المحددة نفسها افتراضيا: `release_package_spec=openclaw@<tag>` المنشورة تستنتج `codex_plugin_spec=npm:@openclaw/codex@<tag>`، بينما تحزم تشغيلات SHA/العناصر الأثرية `extensions/codex` من المرجع المحدد. اضبط `codex_plugin_spec` صراحة لمصادر Plugin مخصصة مثل مواصفات `npm:` أو `npm-pack:` أو `git:`.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، والعناصر الأثرية، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يغير الحالة. شغله
من `release/YYYY.M.PATCH` أو `main` بعد وجود وسم الإصدار وبعد نجاح
الفحص التمهيدي لـ npm الخاص بـ OpenClaw. يتحقق من `pnpm plugins:sync:check`،
ويشغل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغل
`Plugin ClawHub Release` للـ SHA نفسه الخاص بالإصدار، وبعد ذلك فقط يشغل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ. يتطلب النشر stable أيضا
`windows_node_tag` مطابقا؛ يتحقق سير العمل من إصدار مصدر Windows
ويقارن مثبتاته x64/ARM64 مع إدخال
`windows_node_installer_digests` المعتمد للمرشح قبل أي ابن نشر، ثم يرقّي
ويتحقق من ملخصات المثبتات المثبتة نفسها إضافة إلى الأصل المصاحب الدقيق
وعقد checksum قبل نشر مسودة إصدار GitHub.

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

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعا أو وسوما، وليست SHAs التزام خام. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويشغل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل سير عمل ابن
`headSha` يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل المدقق الجامع أيضا إذا عمل أي سير عمل ابن عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/المزود الممرر إلى فحوصات الإصدار. تفترض
سير عمل الإصدار اليدوية `stable` افتراضيا؛ استخدم `full` فقط عندما
تريد عمدا مصفوفة المزود/الوسائط الاستشارية الواسعة. تشغل فحوصات الإصدار stable وfull
دائما تغطية live/E2E الشاملة ومسار إصدار Docker الطويل؛
ويمكن لملف beta التعريفي الاشتراك عبر `run_release_soak=true`.

- `minimum` يبقي أسرع مسارات OpenAI/core الحرجة للإصدار.
- `stable` يضيف مجموعة المزود/الخلفية stable.
- `full` يشغل مصفوفة المزود/الوسائط الاستشارية الواسعة.

يسجل الجامع معرّفات تشغيل الأبناء المشغلة، وتعيد مهمة `Verify full validation` النهائية فحص استنتاجات تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أعيد تشغيل سير عمل ابن وأصبح أخضر، فأعد تشغيل مهمة المدقق الأب فقط لتحديث نتيجة الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، أو `ci` لابن CI الكامل العادي فقط، أو `plugin-prerelease` لابن prerelease الخاص بـ Plugin فقط، أو `release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على الجامع. يبقي هذا إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز. لمسار cross-OS فاشل واحد، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثلا `windows/packaged-upgrade`؛ تبث أوامر cross-OS الطويلة أسطر Heartbeat وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات QA الخاصة بفحوصات الإصدار استشارية باستثناء بوابة تغطية أدوات وقت التشغيل القياسية، التي تحظر عندما تنحرف أدوات OpenClaw الديناميكية المطلوبة أو تختفي من ملخص المستوى القياسي.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم تمرر ذلك العنصر الأثري إلى فحوصات cross-OS وPackage Acceptance، إضافة إلى سير عمل Docker الحي/E2E لمسار الإصدار عند تشغيل تغطية soak. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تحزيم المرشح نفسه في عدة مهام أبناء. بالنسبة لمسار Codex npm-plugin الحي، تمرر فحوصات الإصدار إما مواصفة Plugin منشورة مطابقة مستنتجة من `release_package_spec`، أو تمرر `codex_plugin_spec` الذي يوفره المشغل، أو تترك الإدخال فارغا كي يحزم سكربت Docker Plugin Codex من checkout المحدد.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تستبدل الجامع الأقدم. يلغي مراقب الأب أي سير عمل ابن
كان قد شغله عندما يلغى الأب، لذلك لا تقف عملية تحقق main الأحدث
خلف تشغيل فحص إصدار قديم مدته ساعتان. تحتفظ عمليات تحقق فرع/وسم
الإصدار ومجموعات إعادة التشغيل المركزة بـ `cancel-in-progress: false`.

## أجزاء Live وE2E

يبقي ابن live/E2E الخاص بالإصدار تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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

يحافظ ذلك على تغطية الملفات نفسها مع جعل أعطال المزود الحي البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء الأجزاء الجامعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لعمليات إعادة التشغيل اليدوية أحادية اللقطة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط فقط من الثنائيات قبل الإعداد. أبق مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لإطلاق اختبارات Docker متداخلة.

تستخدم أجزاء النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تنفيذ مختار. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المجزأ حسب المزوّد، وخلفية CLI، وربط ACP، وأجزاء حزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل، بحيث يفشل مسار الحاوية العالقة أو التنظيف بسرعة بدلاً من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الأجزاء بناء هدف Docker للمصدر الكامل بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقت التنفيذ على بناء صور مكرر.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` المرجع `workflow_ref`، ويحل مرشح حزمة واحداً، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويحضّر صور Docker ذات بصمة الحزمة عند الحاجة، ويشغل مسارات Docker المختارة على تلك الحزمة بدلاً من حزم نسخة سير العمل المفحوصة. عندما يختار ملف تعريفي عدة `docker_lanes` مستهدفة، يحضّر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية ذات آثار فريدة.
3. يستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحداً؛ ويمكن لتشغيل Telegram المستقل أن يظل قادراً على تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التمهيدية/المستقرة المنشورة.
- يحزم `source=ref` فرعاً، أو وسمًا، أو SHA تنفيذ كاملاً موثوقاً من `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التنفيذ المختار قابل للوصول من سجل فروع المستودع أو وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عاماً عبر HTTPS؛ ويكون `package_sha256` مطلوباً. يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو عناوين IP المحلولة الخاصة/الداخلية/ذات الاستخدام الخاص، وإعادة التوجيه خارج سياسة الأمان العامة نفسها.
- ينزل `source=trusted-url` ملف `.tgz` عبر HTTPS من سياسة مصدر موثوق مسماة في `.github/package-trusted-sources.json`؛ ويكون `package_sha256` و`trusted_source_id` مطلوبين. استخدم هذا فقط لمرايا المؤسسات أو مستودعات الحزم الخاصة المملوكة للمشرفين التي تحتاج إلى مضيفين، أو منافذ، أو بادئات مسارات، أو مضيفي إعادة توجيه، أو حل شبكة خاصة مهيأة. إذا أعلنت السياسة مصادقة bearer، يستخدم سير العمل السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`؛ وتظل بيانات الاعتماد المضمنة في URL مرفوضة.
- ينزل `source=artifact` ملف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختيارياً لكنه ينبغي توفيره للآثار المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو تنفيذ المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح ذلك لحزمة الاختبار الحالية التحقق من تنفيذات مصدر موثوقة أقدم من دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزم

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية Plugin دون اتصال حتى لا يعتمد التحقق من الحزمة المنشورة على توفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للتشغيلات المستقلة.

لسياسة اختبار التحديثات وPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. يبقي ذلك إثبات ترحيل الحزمة، والتحديث، وتثبيت Skills الحي من ClawHub، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المهيأ، وPlugin دون اتصال، وتحديث Plugin، وTelegram على tarball الحزمة المحلول نفسه. عيّن `release_package_spec` على Full Release Validation أو OpenClaw Release Checks بعد نشر إصدار beta لتشغيل المصفوفة نفسها على حزمة npm المشحونة من دون إعادة بناء؛ وعيّن `package_acceptance_package_spec` فقط عندما يحتاج قبول الحزمة إلى حزمة مختلفة عن بقية تحقق الإصدار. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي السلوك الخاص بنظام التشغيل في الإعداد الأولي، والمثبت، والمنصة؛ وينبغي أن يبدأ تحقق المنتج للحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة في كل تشغيل ضمن مسار الإصدار الحاجب. في قبول الحزمة، يكون tarball `package-under-test` المحلول هو المرشح دائماً، ويختار `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. يعيّن Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيم `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر أحدث أربعة إصدارات npm مستقرة إضافة إلى إصدارات حدود توافق Plugin المثبتة ومثبتات بشكل قضايا لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المهيأة، ومسارات سجلات tilde، وجذور اعتماديات Plugin القديمة الراكدة. تُجزأ اختيارات ناجي الترقية المنشورة متعددة الخطوط الأساسية حسب الخط الأساسي إلى مهام تشغيل Docker مستهدفة منفصلة. يستخدم سير العمل المنفصل `Update Migration` مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف تحديث منشور شامل، لا اتساع Full Release CI العادي. يمكن للتشغيلات المحلية المجمعة تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows للحزمة والمثبت الجديدة أيضاً من أن الحزمة المثبتة يمكنها استيراد تجاوز تحكم بالمتصفح من مسار Windows خام مطلق. يفترض اختبار الدخان لدورة الوكيل عبر أنظمة التشغيل مع OpenAI القيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

يملك قبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة بالفعل. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يحذف `update-channel-switch` اعتماديات pnpm `patchedDependencies` المفقودة من مثبت git المزيف المشتق من tarball وقد يسجل غياب `update.channel` المستمر؛
- قد تقرأ اختبارات Plugin الدخانية مواقع سجلات التثبيت القديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التكوين مع الاستمرار في طلب بقاء سجل التثبيت وسلوك عدم إعادة التثبيت من دون تغيير.

قد تحذر الحزمة المنشورة `2026.4.26` أيضاً من ملفات ختم بيانات تعريف البناء المحلية التي كانت قد شُحنت بالفعل. يجب أن تلبي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلاً من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة، وإصدارها، وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار دخاني للتثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الاختبار الدخاني إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزم/بيانات تعريف Plugin المضمّنة، أو أسطح Plugin SDK/Gateway/القنوات/Plugin الأساسية التي تمارسها مهام دخان Docker. لا تحجز تغييرات Plugin المضمّنة الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغّل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء امتداد مضمّن، ويشغّل ملف تعريف Docker المحدود للـ Plugin المضمّن ضمن مهلة أوامر إجمالية تبلغ 240 ثانية (مع تحديد تشغيل Docker لكل سيناريو على حدة).
- يحافظ **المسار الكامل** على تغطية تثبيت حزمة QR وDocker/update للمثبّت للتشغيلات الليلية المجدولة، وعمليات الإرسال اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعليا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة دخان GHCR Dockerfile جذرية واحدة لهدف target-SHA، ثم يشغّل تثبيت حزمة QR، ودخان Dockerfile/Gateway الجذري، ودخان المثبّت/update، واختبار Docker E2E السريع للـ Plugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف دخان الصور الجذرية.

لا تفرض عمليات الدفع إلى `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة على push، يحافظ workflow على دخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يُبوّب دخان مزوّد الصور لتثبيت Bun العام البطيء بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن workflow فحوصات الإصدار، ويمكن لعمليات إرسال `Install Smoke` اليدوية اختياره، لكن طلبات السحب وعمليات الدفع إلى `main` لا تفعل ذلك. لا يزال CI العادي لطلبات السحب يشغّل مسار انحدار مشغّل Bun السريع للتغييرات ذات الصلة بـ Node. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها والمركّزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة واحدة مسبقا، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git عار لمسارات المثبّت/update/اعتمادية Plugin؛
- صورة وظيفية تثبّت نفس tarball في `/app` لمسارات الوظائف العادية.

تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### عناصر قابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات المجمّع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات مجمّع الذيل الحساس للمزوّد.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تفرض المزوّدات الاختناق.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التدرّج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم وجود تدرّج.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم المسارات الحية/الذيلية المحددة حدودا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز دخان التنظيف حتى يتمكن الوكلاء من إعادة إنتاج مسار واحد فاشل. |

لا يزال بإمكان مسار أثقل من حده الفعال أن يبدأ من مجمّع فارغ، ثم يعمل وحده حتى يحرر السعة. تتحقق الفحوصات التمهيدية الإجمالية المحلية من Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولا، وتتوقف افتراضيا عن جدولة مسارات مجمّعة جديدة بعد أول فشل.

### workflow حي/E2E قابل لإعادة الاستخدام

يسأل workflow الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل artifact حزمة من التشغيل الحالي، أو ينزّل artifact حزمة من `package_artifact_run_id`؛ ويتحقق من جرد tarball؛ ويبني ويدفع صور GHCR Docker E2E العارية/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة في Blacksmith عندما تحتاج الخطة إلى مسارات مثبّتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلا من إعادة البناء. تُعاد محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعيد تيار registry/cache العالق المحاولة بسرعة بدلا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار بمهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفّذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. يتضمن `package-update-openai` مسار حزمة Codex Plugin الحي، الذي يثبّت حزمة OpenClaw المرشحة، ويثبّت Codex Plugin من `codex_plugin_spec` أو tarball من المرجع نفسه مع موافقة صريحة على تثبيت Codex CLI، ويشغّل الفحص التمهيدي لـ Codex CLI، ثم يشغّل عدة دورات لوكيل OpenClaw في الجلسة نفسها ضد OpenAI. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/runtime. يبقى اسم المسار المستعار `install-e2e` اسم إعادة التشغيل اليدوي التجميعي لكلا مساري مثبّت المزوّد.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات إرسال OpenWebUI فقط. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل شبكة npm العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مُدخل workflow `docker_lanes` المسارات المحددة ضد الصور المعدّة بدلا من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدودا في مهمة Docker مستهدفة واحدة ويجهّز أو ينزّل أو يعيد استخدام artifact الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسارا حيا في Docker، تبني المهمة المستهدفة صورة الاختبار الحي محليا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل في GitHub المولّدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المعدّة عندما تكون تلك القيم موجودة، حتى يتمكن مسار فاشل من إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل workflow الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميا.

## الإصدار التمهيدي للـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو workflow منفصل يُرسل بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تبقي طلبات السحب العادية، وعمليات الدفع إلى `main`، وعمليات إرسال CI اليدوية المستقلة تلك المجموعة معطلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال امتداد؛ تشغّل مهام أجزاء الامتداد هذه ما يصل إلى مجموعتي تكوين Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker التمهيدي الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام تستغرق من دقيقة إلى ثلاث دقائق. يرفع workflow أيضا artifact معلوماتيا باسم `plugin-inspector-advisory` من `@openclaw/plugin-inspector`؛ نتائج المفتش هي مدخلات فرز ولا تغيّر بوابة `Plugin Prerelease` الحاجزة.

## QA Lab

لدى QA Lab مسارات CI مخصصة خارج workflow الرئيسي ذي النطاق الذكي. تكافؤ الوكلاء متداخل ضمن أحزمة QA والإصدار الواسعة، وليس workflow مستقلا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يسير التكافؤ مع تشغيل تحقق واسع.

- يشغّل workflow `QA-Lab - All Lanes` ليليا على `main` وعند الإرسال اليدوي؛ يوزّع مسار تكافؤ المحاكاة، ومسار Matrix الحي، ومسارات Telegram وDiscord الحية كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex leases.

تشغّل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين مع مزوّد المحاكاة الحتمي والنماذج المؤهلة بالمحاكاة (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء تشغيل provider-plugin العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النموذج الحي، والمزوّد الأصلي، ومزوّد Docker المنفصلة اتصال المزوّد.

يستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI المستخرج ذلك. يبقى الافتراضي في CLI ومدخل workflow اليدوي `all`؛ يؤدي إرسال `matrix_profile=all` اليدوي دائما إلى تجزئة تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضا مسارات QA Lab الحرجة للإصدار قبل الموافقة على الإصدار؛ تشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسار متوازية، ثم تنزّل كلا الـ artifacts إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

لطلبات السحب العادية، اتبع أدلة CI/الفحوصات محددة النطاق بدلا من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

workflow `CodeQL` هو عمدا ماسح أمني ضيق للمرور الأول، وليس مسحا كاملا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة شيفرة workflow الخاصة بـ Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمنية عالية الثقة مرشحة إلى `security-severity` عال/حرج.

تبقى حراسة طلب السحب خفيفة: لا تبدأ إلا للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل workflow المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج افتراضيات طلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، الأسرار، sandbox، Cron، وخط أساس Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                  |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وweb-fetch، وسياسة SSRF في Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح ثقة تثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                         |

### شرائح الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شريحة أمان Android مجدولة. تبني تطبيق Android يدوياً من أجل CodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة workflow. ترفع النتائج تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شريحة أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدوياً من أجل CodeQL على Blacksmith macOS، وتستبعد نتائج بناء التبعيات من SARIF المرفوع، وترفع النتائج تحت `/codeql-critical-security/macos`. تُبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفاً.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشريحة غير الأمنية المطابقة. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغّلات Linux المستضافة على GitHub حتى لا تستهلك فحوص الجودة ميزانية تسجيل مشغّلات Blacksmith. حارس طلبات السحب الخاص بها أصغر عمداً من الملف الشخصي المجدول: طلبات السحب غير المسودة تشغّل فقط شرائح `agent-runtime-boundary`، و`config-boundary`، و`core-auth-secrets`، و`channel-runtime-boundary`، و`gateway-runtime-boundary`، و`memory-runtime-boundary`، و`mcp-process-runtime-boundary`، و`provider-runtime-boundary`، و`session-diagnostics-boundary`، و`plugin-boundary`، و`plugin-sdk-package-contract`، و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وتوزيع الردود، وكود مخطط الإعدادات/الترحيل/الإدخال والإخراج، وكود المصادقة/الأسرار/sandbox/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/وصلات SDK، وMCP/العملية/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/صفوف التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل ردود Plugin SDK. تغييرات إعدادات CodeQL وworkflow الجودة تشغّل شرائح جودة طلبات السحب الاثنتي عشرة كلها.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الشخصية الضيقة هي نقاط ربط للتعليم/التكرار لتشغيل شريحة جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، والأسرار، وsandbox، وCron، وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال والإخراج                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت تشغيل تنفيذ الأوامر، وتوجيه النموذج/المزوّد، وتوزيع الرد التلقائي وصفوفه، ومستوى تحكم ACP                                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، ووصلات تفعيل وقت تشغيل الذاكرة، وأوامر doctor الخاصة بالذاكرة            |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات صف الردود، وصفوف تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI الخاصة بـ doctor للجلسات             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزيع الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الرد، وخيارات رد القناة، وصفوف التسليم، ومساعدات ربط الجلسة/الخيط                       |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/كتالوجات المزوّد، وسجلات web/search/fetch/embedding                  |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد Control UI، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل الجلب/البحث عبر الويب الأساسية، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                           |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                              |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمّنة كعمل لاحق مضبوط النطاق أو مقسّم إلى شرائح فقط بعد أن تمتلك الملفات الشخصية الضيقة وقت تشغيل وإشارة مستقرين.

## Workflows الصيانة

### Docs Agent

workflow `Docs Agent` هو مسار صيانة Codex قائم على الأحداث لإبقاء الوثائق الحالية متوافقة مع التغييرات التي وصلت مؤخراً. ليس له جدول خالص: يمكن لتشغيل CI ناجح لدفع غير صادر عن bot على `main` أن يفعّله، ويمكن للتشغيل اليدوي أن يشغّله مباشرة. تتخطى استدعاءات workflow-run التشغيل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أُنشئ خلال الساعة الأخيرة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر الخاص بتشغيل Docs Agent غير المتخطى السابق إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على الوثائق.

### Test Performance Agent

workflow `Test Performance Agent` هو مسار صيانة Codex قائم على الأحداث للاختبارات البطيئة. ليس له جدول خالص: يمكن لتشغيل CI ناجح لدفع غير صادر عن bot على `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد عمل أو يعمل بالفعل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمّعاً للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبارات صغيرة تحافظ على التغطية فقط بدلاً من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. يسجل التقرير المجمّع زمن الجدار لكل إعداد والحد الأقصى لـ RSS على Linux وmacOS، لذلك تُظهر مقارنة قبل/بعد فروقات ذاكرة الاختبارات إلى جانب فروقات المدة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يمكن لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع bot، يعيد المسار تأسيس الرقعة التي جرى التحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع مجدداً؛ وتُتخطى الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يستطيع إجراء Codex الحفاظ على وضعية السلامة نفسها الخاصة بإسقاط sudo كما في وكيل الوثائق.

### طلبات السحب المكررة بعد الدمج

workflow `Duplicate PRs After Merge` هو workflow يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يكون افتراضياً في وضع dry-run ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الذي هبط قد دُمج وأن لكل تكرار إما مشكلة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أكثر صرامة حول حدود المعمارية من النطاق الواسع لمنصة CI:

- تغييرات الإنتاج الأساسية تشغّل فحص الأنواع للإنتاج الأساسي واختبارات الأساس إضافة إلى lint/guards الأساسية؛
- تغييرات الاختبارات الأساسية فقط تشغّل فقط فحص أنواع اختبارات الأساس إضافة إلى lint الأساسي؛
- تغييرات إنتاج الامتدادات تشغّل فحص أنواع إنتاج الامتدادات واختبارات الامتدادات إضافة إلى lint الامتدادات؛
- تغييرات اختبارات الامتدادات فقط تشغّل فحص أنواع اختبارات الامتدادات إضافة إلى lint الامتدادات؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على تلك العقود الأساسية (تبقى جولات Vitest للامتدادات عملاً اختبارياً صريحاً)؛
- زيادات الإصدار الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوصاً موجّهة للإصدار/الإعدادات/تبعية الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغيير المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمداً من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين في رسم الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد الخرائط الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو prompt نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى تراجعات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعاً بما يكفي على مستوى harness بحيث لا تكون المجموعة الرخيصة المرسومة وكيلاً موثوقاً.

## تحقق Testbox

Crabbox هو مغلّف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه
من جذر المستودع عندما يكون الفحص واسعاً جداً لحلقة تحرير محلية، أو عندما تهم
مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات حزم،
أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. الواجهة الخلفية العادية لـ OpenClaw هي
`blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة خياراً احتياطياً عند أعطال Blacksmith
أو مشكلات الحصة أو اختبار السعة المملوكة صراحة.

تشغّل عمليات Blacksmith المدعومة بـ Crabbox عمليات الإحماء، والمطالبة، والمزامنة، والتشغيل، والإبلاغ، والتنظيف
لـ Testboxes أحادية الاستخدام. يفشل فحص سلامة المزامنة المضمّن بسرعة عندما تختفي ملفات
الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يُظهر `git status --short`
ما لا يقل عن 200 حذف متتبّع. بالنسبة إلى PRs ذات الحذف الكبير المتعمّد، اضبط
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` للأمر البعيد.

ينهي Crabbox أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في
مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر
بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً رغم أن `.crabbox.yaml` يحتوي على إعدادات افتراضية للسحابة المملوكة. في أشجار عمل Codex أو عمليات السحب المرتبطة/المتناثرة، تجنّب سكربت `pnpm crabbox:run` المحلي لأن pnpm قد يوفّق التبعيات قبل بدء Crabbox؛ استدعِ غلاف node مباشرةً بدلًا من ذلك:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

تتطلب عمليات التشغيل المدعومة بـ Blacksmith الإصدار Crabbox 0.22.0 أو أحدث حتى يحصل الغلاف على سلوك Testbox الحالي للمزامنة، والطابور، والتنظيف. عند استخدام عملية السحب الشقيقة، أعد بناء الملف الثنائي المحلي المتجاهل قبل عمل التوقيت أو الإثبات:

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider`، و`leaseId`، و`syncDelegated`، و`exitCode`، و`commandMs`، و`totalMs`. ينبغي أن توقف عمليات Crabbox أحادية الاستخدام والمدعومة بـ Blacksmith الـ Testbox تلقائيًا؛ إذا توقفت عملية تشغيل بشكل غير متوقع أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق نفسه بعد ترطيبه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كان Crabbox هو الطبقة المعطلة لكن Blacksmith نفسه يعمل، فاستخدم
Blacksmith مباشرةً فقط للتشخيصات مثل `list`، و`status`، والتنظيف. أصلح
مسار Crabbox قبل التعامل مع تشغيل Blacksmith مباشر كإثبات للمشرفين.

إذا عمل `blacksmith testbox list --all` و`blacksmith testbox status` لكن عمليات
الإحماء الجديدة بقيت `queued` دون IP أو عنوان URL لتشغيل Actions بعد بضع دقائق،
فتعامل مع ذلك كضغط على مزوّد Blacksmith، أو الطابور، أو الفوترة، أو حدود المؤسسة. أوقف
المعرّفات الموضوعة في الطابور التي أنشأتها، وتجنّب بدء المزيد من Testboxes، وانقل الإثبات إلى
مسار سعة Crabbox المملوكة أدناه بينما يفحص أحدهم لوحة معلومات Blacksmith،
والفوترة، وحدود المؤسسة.

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت ضغط AWS، تجنّب `class=beast` ما لم تكن المهمة تحتاج فعلًا إلى CPU من فئة 48xlarge. يبدأ طلب `beast` عند 192 vCPU وهو أسهل طريقة لتجاوز حصة EC2 Spot الإقليمية أو حصة On-Demand Standard. تضبط `.crabbox.yaml` المملوكة للمستودع الإعدادات الافتراضية إلى `standard`، ومناطق سعة متعددة، و`capacity.hints: true` بحيث تطبع عقود AWS المتوسّطة المنطقة/السوق المختارين، وضغط الحصة، والرجوع إلى Spot، وتحذيرات الفئات عالية الضغط. استخدم `fast` للفحوص الواسعة الأثقل، و`large` فقط بعد أن لا تكفي standard/fast، و`beast` فقط للمسارات الاستثنائية المعتمدة على CPU مثل الحزمة الكاملة أو مصفوفات Docker لكل Plugin، أو التحقق الصريح للإصدار/الحاجب، أو قياس الأداء عالي الأنوية. لا تستخدم `beast` مع `pnpm check:changed`، أو الاختبارات المركّزة، أو العمل الخاص بالوثائق فقط، أو lint/typecheck العادي، أو إعادة إنتاج E2E صغيرة، أو فرز انقطاع Blacksmith. استخدم `--market on-demand` لتشخيص السعة حتى لا يختلط اضطراب سوق Spot بالإشارة.

تمتلك `.crabbox.yaml` إعدادات المزوّد، والمزامنة، وترطيب GitHub Actions الافتراضية لمسارات السحابة المملوكة. وهي تستبعد `.git` المحلي حتى يحتفظ سحب Actions بعد الترطيب ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية للمشرفين، وتستبعد آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يمتلك `.github/workflows/crabbox-hydrate.yml` السحب، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

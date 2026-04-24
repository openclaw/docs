---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت بصدد تصحيح أخطاء فحوصات GitHub Actions الفاشلة
summary: مخطط مهام CI، وبوابات النطاق، والأوامر المحلية المكافئة
title: مسار CI
x-i18n:
    generated_at: "2026-04-24T07:33:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

يعمل CI عند كل push إلى `main` وكل pull request. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تكون التغييرات مقتصرة على مناطق غير ذات صلة.

يمتلك QA Lab مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. يعمل
سير العمل `Parity gate` على تغييرات PR المطابقة وعند التشغيل اليدوي؛ حيث
يبني بيئة QA الخاصة ويقارن حزمتَي الوكلاء mock GPT-5.4 وOpus 4.6.
ويعمل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند
التشغيل اليدوي؛ ويقوم بتشعيب mock parity gate ومسار Matrix الحي ومسار
Telegram الحي كمهام متوازية. تستخدم المهام الحية البيئة `qa-live-shared`،
ويستخدم مسار Telegram عقود Convex. كما يشغّل `OpenClaw Release
Checks` مسارات QA Lab نفسها قبل اعتماد الإصدار.

سير العمل `Duplicate PRs After Merge` هو سير عمل صيانة يدوي للمشرفين من أجل
تنظيف التكرارات بعد الدمج. تكون قيمته الافتراضية dry-run ولا يغلق إلا PRs
المذكورة صراحةً عندما تكون `apply=true`. وقبل إجراء أي تعديل على GitHub،
يتحقق من أن PR الذي تم إنزاله قد دُمج، وأن كل PR مكرر لديه إما issue
مرجعية مشتركة أو hunkات تغييرات متداخلة.

سير العمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث للحفاظ على
اتساق المستندات الحالية مع التغييرات التي هبطت مؤخرًا. ليس لديه جدول زمني
خالص: يمكن لنجاح تشغيل push CI من غير البوت على `main` أن يفعّله، كما يمكن
للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات workflow-run التنفيذ إذا
كان `main` قد تقدم، أو إذا تم إنشاء تشغيل Docs Agent آخر غير متخطى خلال
الساعة الماضية. وعندما يعمل، فإنه يراجع نطاق الالتزامات من SHA المصدر
السابق لآخر Docs Agent غير متخطى إلى `main` الحالي، بحيث يمكن لتشغيل واحد
كل ساعة أن يغطي جميع تغييرات main المتراكمة منذ آخر مرور على المستندات.

سير العمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث
للاختبارات البطيئة. ليس لديه جدول زمني خالص: يمكن لنجاح تشغيل push CI من
غير البوت على `main` أن يفعّله، لكنه يتخطى التنفيذ إذا كان هناك استدعاء
workflow-run آخر قد نُفذ أو لا يزال قيد التنفيذ في ذلك اليوم وفق UTC.
يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني هذا المسار تقرير أداء
Vitest مجمعًا للمجموعة الكاملة، ثم يسمح لـ Codex بإجراء إصلاحات صغيرة فقط
لأداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة الهيكلة الواسعة، ثم
يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد الاختبارات
الناجحة في خط الأساس. إذا كان خط الأساس يحتوي على اختبارات فاشلة، فقد يصلح
Codex فقط الإخفاقات الواضحة، ويجب أن ينجح تقرير المجموعة الكاملة بعد عمل
الوكيل قبل اعتماد أي شيء. عندما يتقدم `main` قبل أن يهبط push الخاص
بالبوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل
`pnpm check:changed`، ويحاول الدفع مجددًا؛ أما الرقع القديمة المتعارضة
فيتم تخطيها. ويستخدم Ubuntu المستضافة من GitHub حتى يتمكن إجراء Codex من
الحفاظ على وضع الأمان نفسه drop-sudo كما في وكيل المستندات.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## نظرة عامة على المهام

| المهمة                           | الغرض                                                                                         | وقت التشغيل                        |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات docs فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI             | دائمًا على pushes وPRs غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق workflow عبر `zizmor`                                           | دائمًا على pushes وPRs غير المسودة |
| `security-dependency-audit`      | تدقيق lockfile إنتاجي بلا تبعيات مقابل تنبيهات npm                                           | دائمًا على pushes وPRs غير المسودة |
| `security-fast`                  | مجمّع مطلوب لمهام الأمان السريعة                                                               | دائمًا على pushes وPRs غير المسودة |
| `build-artifacts`                | بناء `dist/` وControl UI وفحوصات البنى الناتجة وartifacts القابلة لإعادة الاستخدام لاحقًا     | تغييرات ذات صلة بـ Node            |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات bundled/plugin-contract/protocol                         | تغييرات ذات صلة بـ Node            |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المُجزأة مع نتيجة فحص مجمّعة مستقرة                                       | تغييرات ذات صلة بـ Node            |
| `checks-node-extensions`         | شظايا اختبارات كاملة للـ bundled-plugin عبر مجموعة الامتدادات                                 | تغييرات ذات صلة بـ Node            |
| `checks-node-core-test`          | شظايا اختبارات Node الأساسية، باستثناء مسارات القنوات وbundled والعقود والامتدادات            | تغييرات ذات صلة بـ Node            |
| `extension-fast`                 | اختبارات مركزة فقط للـ plugins المضمّنة التي تغيرت                                            | Pull requests مع تغييرات امتدادات |
| `check`                          | المكافئ المحلي الرئيسي المجزأ: أنواع prod وlint وguards وأنواع الاختبارات وstrict smoke        | تغييرات ذات صلة بـ Node            |
| `check-additional`               | شظايا معمارية وحدود وguards لسطح الامتدادات وحدود الحزم وgateway-watch                        | تغييرات ذات صلة بـ Node            |
| `build-smoke`                    | اختبارات smoke لـ CLI المبني وstartup-memory smoke                                            | تغييرات ذات صلة بـ Node            |
| `checks`                         | متحقق لاختبارات القنوات على البنى الناتجة بالإضافة إلى توافق Node 22 الخاص بالـ push فقط      | تغييرات ذات صلة بـ Node            |
| `check-docs`                     | تنسيق docs وlint وفحوصات الروابط المعطلة                                                      | عند تغيّر docs                     |
| `skills-python`                  | Ruff + pytest للـ Skills المعتمدة على Python                                                  | تغييرات ذات صلة بـ Python skills   |
| `checks-windows`                 | مسارات اختبارات خاصة بـ Windows                                                               | تغييرات ذات صلة بـ Windows         |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام البنى الناتجة المشتركة                            | تغييرات ذات صلة بـ macOS           |
| `macos-swift`                    | lint وbuild واختبارات Swift لتطبيق macOS                                                      | تغييرات ذات صلة بـ macOS           |
| `android`                        | اختبارات وحدات Android لكلا النكهتين بالإضافة إلى بناء APK debug واحد                        | تغييرات ذات صلة بـ Android         |
| `test-performance-agent`         | تحسين يومي للاختبارات البطيئة بواسطة Codex بعد نشاط موثوق                                    | نجاح Main CI أو التشغيل اليدوي     |

## ترتيب الإخفاق السريع

تُرتب المهام بحيث تفشل الفحوصات الرخيصة قبل تشغيل المهام المكلفة:

1. يحدد `preflight` أي المسارات موجودة أصلًا. ومنطق `docs-scope` و`changed-scope` هما خطوتان داخل هذه المهمة وليسا مهمتين مستقلتين.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام artifacts والمنصات الأثقل.
3. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. بعد ذلك تتشعب مسارات المنصات وبيئات التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-extensions` و`checks-node-core-test` و`extension-fast` الخاص بالـ PR فقط و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`.
تتحقق تعديلات سير عمل CI من مخطط Node CI بالإضافة إلى linting الخاص بـ workflow، لكنها لا تفرض بمفردها بناءات أصلية لـ Windows أو Android أو macOS؛ إذ تظل مسارات تلك المنصات محصورة في تغييرات مصدر المنصة.
تُحدد فحوصات Node على Windows وفق أغلفة المسار/العملية الخاصة بـ Windows، ومساعدات تشغيل npm/pnpm/UI، وإعدادات مدير الحزم، وأس surfaces سير عمل CI التي تنفذ ذلك المسار؛ أما تغييرات المصدر أو Plugin أو install-smoke أو الاختبارات فقط غير المرتبطة فتظل في مسارات Linux Node حتى لا تحجز عامل Windows بـ 16 vCPU لتغطية جرى تنفيذها أصلًا بواسطة شظايا الاختبار العادية.
يعيد سير العمل المنفصل `install-smoke` استخدام نص النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يقسم تغطية smoke إلى `run_fast_install_smoke` و`run_full_install_smoke`. تشغل pull requests المسار السريع لأسطح Docker/package، وتغييرات package/manifest الخاصة بالـ bundled plugin، وأس surfaces Plugin/channel/gateway/Plugin SDK الأساسية التي تمارسها مهام Docker smoke. أما تغييرات bundled plugin المصدرية فقط، أو التعديلات الخاصة بالاختبارات فقط، أو docs فقط، فلا تحجز عمّال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويفحص CLI، ويشغّل e2e للحاوية على شبكة gateway، ويتحقق من وسيطة build لامتداد مضمّن، ويشغّل profile Docker محدودًا للـ bundled-plugin تحت مهلة أوامر مقدارها 120 ثانية. يحتفظ المسار الكامل بتغطية تثبيت حزمة QR وinstaller Docker/update للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وpull requests التي تلمس فعلًا أسطح installer/package/Docker. لا تفرض pushes إلى `main`، بما في ذلك merge commits، المسار الكامل؛ وعندما يطلب منطق changed-scope تغطية كاملة على push، يحتفظ سير العمل بـ fast Docker smoke ويترك full install smoke للتحقق الليلي أو التحقق الخاص بالإصدار. ويُحكم تشغيل smoke البطيء الخاص بموفر صور التثبيت العام لـ Bun بشكل منفصل عبر `run_bun_global_install_smoke`؛ إذ يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `install-smoke` اليدوية الاشتراك فيه، لكن pull requests وpushes إلى `main` لا تشغله. وتحتفظ اختبارات QR وinstaller Docker بملفات Dockerfile الخاصة بها المركزة على التثبيت. محليًا، يقوم `test:docker:all` ببناء صورة live-test مشتركة واحدة مسبقًا وصورة built-app مشتركة واحدة لـ `scripts/e2e/Dockerfile`، ثم يشغّل مسارات smoke الحية/E2E بالتوازي مع `OPENCLAW_SKIP_DOCKER_BUILD=1`؛ ويمكنك ضبط التوازي الافتراضي لمجموعة main البالغ 8 بواسطة `OPENCLAW_DOCKER_ALL_PARALLELISM` وتوازي مجموعة tail الحساسة للمزوّد والبالغ 8 بواسطة `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. يوقف المجمع المحلي افتراضيًا جدولة مسارات جديدة ضمن المجمّع بعد أول فشل، ولكل مسار مهلة 120 دقيقة يمكن تجاوزها عبر `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. ويعكس سير العمل الحي/E2E القابل لإعادة الاستخدام نمط الصورة المشتركة من خلال بناء ودفع صورة Docker E2E واحدة إلى GHCR موسومة بـ SHA قبل مصفوفة Docker، ثم تشغيل المصفوفة مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. ويشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة الخاصة بمسار الإصدار يوميًا. وتظل مصفوفة تحديث/قناة bundled الكاملة يدوية/للمجموعة الكاملة لأنها تنفذ تحديث npm حقيقيًا متكررًا وتمريرات doctor repair.

يعيش منطق changed-lane المحلي في `scripts/changed-lanes.mjs` ويُنفذ بواسطة `scripts/check-changed.mjs`. وهذه البوابة المحلية أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع: تغييرات الإنتاج الأساسية تشغّل typecheck للإنتاج الأساسي بالإضافة إلى اختبارات core، وتغييرات اختبارات core فقط تشغّل فقط typecheck/اختبارات core test، وتغييرات إنتاج الامتدادات تشغّل typecheck لإنتاج الامتدادات بالإضافة إلى اختبارات الامتدادات، وتغييرات اختبارات الامتدادات فقط تشغّل فقط typecheck/اختبارات extension test. أما تغييرات Plugin SDK العامة أو plugin-contract فتمدّد التحقق إلى الامتدادات لأن الامتدادات تعتمد على تلك العقود الأساسية. كما تشغّل زيادات الإصدار الخاصة ببيانات الإصدار فقط فحوصات مستهدفة للإصدار/الإعداد/تبعية الجذر. وتفشل تغييرات الجذر/الإعداد غير المعروفة إلى جميع المسارات كإجراء آمن.

عند pushes، تضيف مصفوفة `checks` المسار `compat-node22` الخاص بالـ push فقط. أما في pull requests، فيُتخطى ذلك المسار وتبقى المصفوفة مركزة على مسارات الاختبار/القنوات العادية.

تُقسَّم أو تُوازَن أبطأ مجموعات اختبارات Node بحيث تبقى كل مهمة صغيرة من دون حجز زائد للـ runners: تعمل عقود القنوات على ثلاث شظايا موزونة، وتُوازَن اختبارات bundled plugin عبر ستة عمّال للامتدادات، وتُقرن مسارات وحدات core الصغيرة، ويعمل auto-reply على ثلاثة عمّال موزونين بدلًا من ستة عمّال صغار، وتُوزَّع إعدادات gateway/plugin الخاصة بـ agentic عبر مهام Node agentic المصدرية فقط الموجودة بدلًا من انتظار built artifacts. تستخدم اختبارات browser وQA والوسائط والـ plugins المتنوعة الواسعة إعدادات Vitest المخصصة لها بدلًا من مجمّع plugins المشترك. تشغّل مهام شظايا الامتدادات مجموعات إعدادات plugin تسلسليًا مع عامل Vitest واحد وheap Node أكبر بحيث لا تُفرِط دفعات plugins الثقيلة استيرادًا في استهلاك runners الصغيرة في CI. يستخدم مسار agents الواسع مجدول Vitest المشترك للتوازي على مستوى الملفات لأنه تهيمن عليه عمليات الاستيراد/الجدولة بدلًا من أن يملكه ملف اختبار بطيء واحد. يعمل `runtime-config` مع شظية infra core-runtime حتى لا تتملك شظية runtime المشتركة الذيل. ويحافظ `check-additional` على أعمال compile/canary الخاصة بحدود الحزم معًا ويفصل معمارية طوبولوجيا runtime عن تغطية gateway watch؛ وتشغّل شظية حارس الحدود حراسها الصغيرة المستقلة بالتوازي داخل مهمة واحدة. تعمل gateway watch واختبارات القنوات وشظية حدود دعم core بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل، مع الاحتفاظ بأسماء الفحوصات القديمة كمهام تحقق خفيفة مع تجنب عاملَي Blacksmith إضافيين وطابور ثانٍ لمستهلكي artifacts.

يشغّل Android CI كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest`، ثم يبني Play debug APK. لا تملك النكهة third-party مجموعة مصادر أو manifest منفصلين؛ ومع ذلك فإن مسار اختبار الوحدات الخاص بها لا يزال يصرّف تلك النكهة باستخدام إشارات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تعبئة APK debug مكررة عند كل push ذي صلة بـ Android.
يكون `extension-fast` مخصصًا للـ PR فقط لأن تشغيلات push تنفذ بالفعل شظايا bundled plugin الكاملة. وهذا يحافظ على تغذية راجعة للـ plugins المتغيرة أثناء المراجعات من دون حجز عامل Blacksmith إضافي على `main` لتغطية موجودة أصلًا في `checks-node-extensions`.

قد يضع GitHub علامة `cancelled` على المهام المستبدلة عندما يهبط push أحدث على الـ PR نفسه أو مرجع `main`. تعامل مع ذلك على أنه ضوضاء CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الشظايا المجمّعة `!cancelled() && always()` بحيث تستمر في الإبلاغ عن إخفاقات الشظايا العادية لكنها لا تدخل الطابور بعد أن يكون سير العمل كله قد استُبدل بالفعل.
مفتاح التزامن في CI مرفق بإصدار (`CI-v7-*`) بحيث لا يمكن لكيان zombie على جانب GitHub في مجموعة طابور قديمة أن يمنع إلى أجل غير مسمى تشغيلات `main` الأحدث.

## الـ runners

| الـ Runner                         | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                     | `preflight`، ومهام الأمان السريعة والمجمّعات (`security-scm-fast` و`security-dependency-audit` و`security-fast`)، وفحوصات protocol/contract/bundled السريعة، وفحوصات عقود القنوات المجزأة، وشظايا `check` باستثناء lint، وشظايا ومجمّعات `check-additional`، ومحققات تجميع اختبارات Node، وفحوصات docs، وPython Skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم preflight الخاص بـ install-smoke أيضًا Ubuntu المستضافة من GitHub حتى يمكن لطابور Blacksmith matrix أن يبدأ مبكرًا |
| `blacksmith-8vcpu-ubuntu-2404`     | `build-artifacts`، وbuild-smoke، وشظايا اختبارات Linux Node، وشظايا اختبارات bundled plugin، و`android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`    | `check-lint`، الذي لا يزال حساسًا بما يكفي للـ CPU بحيث كانت تكلفة 8 vCPU أعلى من التوفير الذي حققته؛ وبناءات Docker الخاصة بـ install-smoke، حيث كانت تكلفة وقت الانتظار لـ 32-vCPU أعلى من التوفير الذي حققته                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025`   | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`    | `macos-node` على `openclaw/openclaw`؛ أما forks فتعود إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest`   | `macos-swift` على `openclaw/openclaw`؛ أما forks فتعود إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## المكافئات المحلية

```bash
pnpm changed:lanes   # فحص مصنّف changed-lane المحلي لـ origin/main...HEAD
pnpm check:changed   # بوابة محلية ذكية: typecheck/lint/tests المتغيرة حسب مسار الحدود
pnpm check          # بوابة محلية سريعة: production tsgo + lint مجزأ + fast guards متوازية
pnpm check:test-types
pnpm check:timed    # البوابة نفسها مع توقيتات لكل مرحلة
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # اختبارات vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # تنسيق docs + lint + الروابط المعطلة
pnpm build          # بناء dist عندما تكون مسارات CI artifact/build-smoke مهمة
node scripts/ci-run-timings.mjs <run-id>      # تلخيص wall time وqueue time وأبطأ المهام
node scripts/ci-run-timings.mjs --recent 10   # مقارنة تشغيلات main CI الناجحة الأخيرة
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات الإصدار](/ar/install/development-channels)

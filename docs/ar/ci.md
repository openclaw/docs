---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح أخطاء فحوصات GitHub Actions الفاشلة
summary: رسم مهام CI البياني، وبوابات النطاق، وما يعادلها من أوامر محلية
title: مسار CI
x-i18n:
    generated_at: "2026-04-26T11:24:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

يعمل CI عند كل push إلى `main` وعند كل pull request. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تكون التغييرات محصورة في مناطق غير ذات صلة.

يحتوي QA Lab على مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. يعمل سير العمل `Parity gate` عند تغييرات PR المطابقة وعند التشغيل اليدوي؛ حيث يبني بيئة تشغيل QA الخاصة ويقارن حزمتَي الوكلاء agentic الوهميتين GPT-5.5 وOpus 4.6. ويعمل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند التشغيل اليدوي؛ حيث يوزع mock parity gate ومسار Matrix الحي ومسار Telegram الحي كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم مسار Telegram عقود Convex. كما يشغّل `OpenClaw Release Checks` مسارات QA Lab نفسها قبل الموافقة على الإصدار.

سير العمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين من أجل تنظيف PRs المكررة بعد الدمج. ويكون افتراضيًا في وضع التشغيل التجريبي، ولا يغلق إلا PRs المدرجة صراحةً عندما تكون `apply=true`. وقبل إجراء أي تعديل على GitHub، يتحقق من أن PR التي تم إنزالها مدمجة، وأن كل عنصر مكرر لديه إما issue مشار إليها مشتركة أو مقاطع تغييرات متداخلة.

سير العمل `Docs Agent` هو مسار صيانة تقوده Codex ويعتمد على الأحداث للمحافظة على توافق الوثائق الحالية مع التغييرات التي نُزلت مؤخرًا. لا يملك جدولًا زمنيًا صرفًا: إذ يمكن لنجاح تشغيل CI على `main` نتيجة push غير صادر من bot أن يفعّله، كما يمكن للتشغيل اليدوي تشغيله مباشرةً. وتتجاوز استدعاءات workflow-run التنفيذ إذا كان `main` قد تقدم أو إذا تم إنشاء تشغيل آخر غير متجاوز لـ Docs Agent خلال الساعة الماضية. وعندما يعمل، فإنه يراجع نطاق الالتزامات من SHA المصدر السابق لآخر Docs Agent غير متجاوز حتى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي جميع تغييرات main المتراكمة منذ آخر مرور على الوثائق.

سير العمل `Test Performance Agent` هو مسار صيانة تقوده Codex ويعتمد على الأحداث للاختبارات البطيئة. لا يملك جدولًا زمنيًا صرفًا: إذ يمكن لنجاح تشغيل CI على `main` نتيجة push غير صادر من bot أن يفعّله، لكنه يتجاوز التنفيذ إذا كان استدعاء workflow-run آخر قد نُفّذ بالفعل أو كان قيد التنفيذ في ذلك اليوم وفق UTC. ويتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني هذا المسار تقرير أداء Vitest مجمّعًا لكامل الحزمة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط على أداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكامل ويرفض التغييرات التي تقلل عدد الاختبارات الناجحة في خط الأساس. وإذا كان خط الأساس يحتوي على اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكامل بعد تنفيذ الوكيل قبل اعتماد أي شيء. وعندما يتقدم `main` قبل وصول push الخاص بالروبوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويحاول push مرة أخرى؛ أما الرقع القديمة المتعارضة فيتم تجاوزها. ويستخدم Ubuntu المستضافة على GitHub حتى يتمكن إجراء Codex من الحفاظ على نفس وضع الأمان drop-sudo الذي يستخدمه وكيل الوثائق.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## نظرة عامة على المهام

| المهمة                           | الغرض                                                                                         | وقت تشغيلها                          |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء manifest الخاص بـ CI | دائمًا في push وPRs غير المسودة      |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                          | دائمًا في push وPRs غير المسودة      |
| `security-dependency-audit`      | تدقيق production lockfile بلا تبعيات مقابل تنبيهات npm                                       | دائمًا في push وPRs غير المسودة      |
| `security-fast`                  | مجمِّع مطلوب لمهام الأمان السريعة                                                              | دائمًا في push وPRs غير المسودة      |
| `build-artifacts`                | بناء `dist/` وControl UI وفحوصات built-artifact وartifacts القابلة لإعادة الاستخدام لاحقًا   | تغييرات ذات صلة بـ Node             |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات bundled/plugin-contract/protocol                         | تغييرات ذات صلة بـ Node             |
| `checks-fast-contracts-channels` | فحوصات channel contract مجزأة مع نتيجة تحقق مجمعة مستقرة                                     | تغييرات ذات صلة بـ Node             |
| `checks-node-extensions`         | أجزاء اختبارات Plugin المضمّنة الكاملة عبر مجموعة الإضافات                                   | تغييرات ذات صلة بـ Node             |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات وbundled وcontract والإضافات            | تغييرات ذات صلة بـ Node             |
| `extension-fast`                 | اختبارات مركزة للإضافات المضمّنة المتغيرة فقط                                                 | pull requests مع تغييرات في الإضافات |
| `check`                          | المكافئ المحلي الرئيسي المجزأ للبوابة: أنواع prod وlint وguards وأنواع الاختبارات وstrict smoke | تغييرات ذات صلة بـ Node             |
| `check-additional`               | architecture وboundary وextension-surface guards وpackage-boundary وgateway-watch مجزأة        | تغييرات ذات صلة بـ Node             |
| `build-smoke`                    | اختبارات built-CLI smoke وstartup-memory smoke                                                | تغييرات ذات صلة بـ Node             |
| `checks`                         | متحقق لاختبارات القنوات الخاصة بـ built-artifact بالإضافة إلى توافق Node 22 على push فقط      | تغييرات ذات صلة بـ Node             |
| `check-docs`                     | تنسيق الوثائق وlint وفحوصات الروابط المعطلة                                                   | عند تغيّر الوثائق                    |
| `skills-python`                  | Ruff + pytest للـ Skills المعتمدة على Python                                                  | تغييرات ذات صلة بـ Python Skills    |
| `checks-windows`                 | مسارات اختبارات خاصة بـ Windows                                                               | تغييرات ذات صلة بـ Windows          |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام built artifacts المشتركة                         | تغييرات ذات صلة بـ macOS            |
| `macos-swift`                    | lint وbuild واختبارات Swift لتطبيق macOS                                                      | تغييرات ذات صلة بـ macOS            |
| `android`                        | اختبارات وحدات Android لكلا النكهتين بالإضافة إلى بناء APK تصحيحي واحد                        | تغييرات ذات صلة بـ Android          |
| `test-performance-agent`         | تحسين يومي للاختبارات البطيئة بواسطة Codex بعد نشاط موثوق                                     | نجاح CI على main أو التشغيل اليدوي   |

## ترتيب الإخفاق السريع

تُرتَّب المهام بحيث تفشل الفحوصات الرخيصة قبل تشغيل المهام المكلفة:

1. يقرر `preflight` أي المسارات موجودة من الأساس. ومنطق `docs-scope` و`changed-scope` هو خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام artifact والمنصات الأثقل.
3. يعمل `build-artifacts` بالتوازي مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد جاهزية البناء المشترك.
4. بعد ذلك تتفرع مسارات المنصات وبيئات التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-extensions` و`checks-node-core-test` و`extension-fast` الخاص بـ PR فقط و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`.
تتحقق تعديلات سير عمل CI من رسم CI البياني الخاص بـ Node بالإضافة إلى lint لسير العمل، لكنها لا تفرض بمفردها عمليات بناء أصلية لـ Windows أو Android أو macOS؛ إذ تبقى مسارات هذه المنصات محصورة بتغييرات مصدر المنصة نفسها.
تستخدم تعديلات توجيه CI فقط، وتعديلات fixtures المحددة والرخيصة لاختبارات core، وتعديلات test-routing/helpers الضيقة الخاصة بـ plugin contract مسار manifest سريعًا خاصًا بـ Node فقط: preflight، والأمان، ومهمة `checks-fast-core` واحدة. ويتجنب هذا المسار build artifacts، وتوافق Node 22، وchannel contracts، والأجزاء الكاملة الخاصة بـ core، وأجزاء bundled-plugin، ومصفوفات الحواجز الإضافية عندما تكون الملفات المتغيرة محصورة في أسطح التوجيه أو helper التي تمارسها المهمة السريعة مباشرةً.
تُحصر فحوصات Windows Node في wrappers الخاصة بالعمليات/المسارات في Windows، وhelpers الخاصة بتشغيل npm/pnpm/UI، وإعدادات package manager، وأس surfaces سير عمل CI التي تنفذ ذلك المسار؛ أما تغييرات المصدر أو Plugin أو install-smoke أو الاختبارات غير ذات الصلة فتبقى على مسارات Linux Node حتى لا تحجز عامل Windows بعدد 16 vCPU لتغطية جرى التحقق منها بالفعل عبر الأجزاء المعتادة للاختبارات.
يعيد سير العمل المنفصل `install-smoke` استخدام script النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يقسم تغطية smoke إلى `run_fast_install_smoke` و`run_full_install_smoke`. وتشغّل pull requests المسار السريع لأسطح Docker/package، وتغييرات package/manifest الخاصة بـ bundled plugin، وأس surfaces core plugin/channel/gateway/Plugin SDK التي تمارسها مهام Docker smoke. أما تغييرات bundled plugin التي تمس المصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط، فلا تحجز عمال Docker. ويبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويفحص CLI، ويشغّل smoke لـ CLI حذف مساحة العمل المشتركة الخاصة بالوكلاء، ويشغّل container gateway-network e2e، ويتحقق من وسيطة build خاصة بإضافة مضمّنة، ويشغّل bounded bundled-plugin Docker profile تحت مهلة مجمعة للأوامر مقدارها 240 ثانية مع تقييد منفصل لكل تشغيل Docker لكل سيناريو. أما المسار الكامل فيحتفظ بتغطية تثبيت حزم QR وتغطية Docker/update الخاصة بالمثبت من أجل التشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وpull requests التي تمس فعلًا أسطح installer/package/Docker. ولا تفرض عمليات push إلى `main`، بما في ذلك merge commits، المسار الكامل؛ فعندما يطلب منطق changed-scope تغطية كاملة في push، يحتفظ سير العمل بـ Docker smoke السريع ويترك full install smoke للتحقق الليلي أو التحقق من الإصدار. أما smoke البطيء الخاص بـ Bun global install image-provider فيُضبط بشكل منفصل بواسطة `run_bun_global_install_smoke`؛ فهو يعمل في الجدولة الليلية ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `install-smoke` اليدوية تضمينه اختياريًا، لكن pull requests وعمليات push إلى `main` لا تشغله. وتحتفظ اختبارات QR وinstaller Docker بملفات Dockerfiles خاصة بها مركزة على التثبيت. ويقوم `test:docker:all` المحلي مسبقًا ببناء صورة live-test مشتركة واحدة وصورة built-app مشتركة واحدة لـ `scripts/e2e/Dockerfile`، ثم يشغّل مسارات smoke الخاصة بـ live/E2E مع مجدول موزون ومع `OPENCLAW_SKIP_DOCKER_BUILD=1`؛ ويمكن ضبط عدد فتحات التجمع الرئيسي الافتراضي البالغ 10 باستخدام `OPENCLAW_DOCKER_ALL_PARALLELISM` وعدد فتحات tail-pool الحساسة للمزوّد والبالغ 10 باستخدام `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. وتكون حدود المسارات الثقيلة افتراضيًا `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` حتى لا تبالغ مسارات تثبيت npm والمسارات متعددة الخدمات في حجز Docker، مع استمرار المسارات الأخف في ملء الفتحات المتاحة. وتبدأ المسارات بتدرج افتراضي قدره ثانيتان لتجنب عواصف الإنشاء في Docker daemon المحلي؛ ويمكن تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` أو أي قيمة أخرى بالمللي ثانية. ويجري المجمّع المحلي فحوصات preflight على Docker، ويزيل حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة، ويحفظ توقيتات المسارات من أجل ترتيب الأطول أولًا، ويدعم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لفحص المجدول. وهو يتوقف عن جدولة مسارات جديدة مجمّعة بعد أول فشل افتراضيًا، ولكل مسار مهلة احتياطية مقدارها 120 دقيقة يمكن تجاوزها عبر `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم بعض مسارات live/tail المختارة حدودًا أشد لكل مسار. ويعكس سير عمل live/E2E القابل لإعادة الاستخدام نمط الصورة المشتركة عبر بناء ودفع صورة Docker E2E واحدة موسومة بـ SHA إلى GHCR قبل مصفوفة Docker، ثم تشغيل المصفوفة مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. ويشغّل سير عمل live/E2E المجدول مجموعة Docker الكاملة الخاصة بمسار الإصدار يوميًا. كما تُقسَّم مصفوفة التحديث المضمّنة بحسب هدف التحديث بحيث يمكن توزيع تمريرات npm update وdoctor repair المتكررة مع فحوصات bundled الأخرى.

يوجد منطق المسارات المتغيرة المحلية في `scripts/changed-lanes.mjs` ويُنفَّذ بواسطة `scripts/check-changed.mjs`. وهذه البوابة المحلية أكثر صرامة فيما يتعلق بحدود architecture مقارنةً بنطاق CI العام للمنصات: فتغييرات production في core تشغّل typecheck للإنتاج في core بالإضافة إلى اختبارات core، وتغييرات اختبارات core فقط تشغّل فقط typecheck/اختبارات core الخاصة بالاختبارات، وتغييرات production في extensions تشغّل typecheck للإنتاج في extension بالإضافة إلى اختبارات extensions، وتغييرات اختبارات extensions فقط تشغّل فقط typecheck/اختبارات extension الخاصة بالاختبارات. أما تغييرات Plugin SDK العامة أو plugin-contract فتوسّع التحقق ليشمل extensions لأن extensions تعتمد على تلك العقود الأساسية. وتشغّل زيادات الإصدارات التي تمس بيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/الإعدادات/تبعيات الجذر. أما تغييرات الجذر/الإعدادات غير المعروفة فتفشل بأمان إلى جميع المسارات.

في عمليات push، تضيف مصفوفة `checks` المسار الخاص بعمليات push فقط `compat-node22`. أما في pull requests، فيتم تجاوز هذا المسار وتظل المصفوفة مركزة على مسارات الاختبارات/القنوات المعتادة.

تُقسَّم أو تُوازَن أكثر عائلات اختبارات Node بطئًا بحيث تبقى كل مهمة صغيرة من دون حجز زائد للعمال: تعمل channel contracts على ثلاثة أجزاء موزونة، وتُوازَن اختبارات bundled plugin عبر ستة عمال للإضافات، وتُقرن مسارات وحدات core الصغيرة، ويعمل auto-reply على أربعة عمال متوازنين مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner وdispatch وcommands/state-routing، كما تُوزَّع إعدادات agentic gateway/plugin على وظائف agentic Node الحالية الخاصة بالمصدر فقط بدلًا من انتظار built artifacts. وتستخدم اختبارات browser وQA وmedia واختبارات plugin المتنوعة الواسعة إعدادات Vitest المخصصة لها بدلًا من plugin catch-all المشترك. وتُشغّل وظائف أجزاء extension ما يصل إلى مجموعتَي إعدادات Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة ومع heap أكبر لـ Node حتى لا تنشئ دفعات Plugins الثقيلة في الاستيراد مهام CI إضافية. ويستخدم المسار الواسع للوكلاء مجدول Vitest المشترك المتوازي على مستوى الملفات لأنه تهيمن عليه عمليات الاستيراد/الجدولة بدلًا من أن يملكه ملف اختبار بطيء واحد. ويعمل `runtime-config` مع جزء infra core-runtime حتى لا يملك جزء runtime المشترك الذيل. وتسجل الأجزاء المعتمدة على أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مفلتر. ويحافظ `check-additional` على تجميع عمل package-boundary compile/canary معًا ويفصل architecture الخاصة بـ runtime topology عن تغطية gateway watch؛ ويشغّل جزء boundary guard حواجزه الصغيرة المستقلة بالتوازي داخل مهمة واحدة. كما تعمل gateway watch واختبارات القنوات وجزء support-boundary الخاص بـ core بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل، مع الإبقاء على أسماء الفحوصات القديمة كمهمات تحقق خفيفة مع تجنب عاملَي Blacksmith إضافيين وطابور ثانٍ لمستهلكي artifact.
يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest`، ثم يبني Play debug APK. ولا تملك النكهة third-party مجموعة مصادر أو manifest منفصلًا؛ ومع ذلك فإن مسار اختبار الوحدات الخاص بها يصرّف تلك النكهة باستخدام إشارات BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف debug APK مكررة في كل push ذي صلة بـ Android.
يكون `extension-fast` خاصًا بـ PR فقط لأن عمليات push تشغّل بالفعل أجزاء bundled plugin الكاملة. وهذا يحافظ على تغذية راجعة سريعة للإضافات المتغيرة أثناء المراجعات دون حجز عامل Blacksmith إضافي على `main` لتغطية موجودة أصلًا في `checks-node-extensions`.

قد يضع GitHub علامة `cancelled` على المهام التي حلّت محلها مهام أحدث عندما تصل عملية push أحدث إلى المرجع نفسه في PR أو `main`. تعامل مع ذلك بوصفه ضجيجًا في CI ما لم يكن أحدث تشغيل للمرجع نفسه فاشلًا أيضًا. وتستخدم فحوصات الأجزاء المجمعة `!cancelled() && always()` حتى تستمر في الإبلاغ عن إخفاقات الأجزاء العادية، لكنها لا تُدرج في الطابور بعد أن يكون سير العمل كله قد استُبدل بالفعل.
مفتاح التزامن في CI مُرقّم بالإصدار (`CI-v7-*`) بحيث لا يتمكن zombie على جانب GitHub داخل مجموعة طوابير قديمة من حجب تشغيلات main الأحدث إلى أجل غير مسمى.

## المشغّلات

| المشغّل                         | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `preflight`، ومهام الأمان السريعة ومجمّعاتها (`security-scm-fast` و`security-dependency-audit` و`security-fast`) وفحوصات protocol/contract/bundled السريعة، وفحوصات channel contract المجزأة، وأجزاء `check` باستثناء lint، وأجزاء ومجمّعات `check-additional`، ومتحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython Skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم preflight الخاص بـ install-smoke أيضًا Ubuntu المستضافة على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-8vcpu-ubuntu-2404`  | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات bundled plugin، و`android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`، الذي لا يزال حساسًا للمعالج بما يكفي لأن 8 vCPU كانت تكلف أكثر مما توفّر؛ وبناءات Docker الخاصة بـ install-smoke، حيث كانت تكلفة وقت الانتظار في طابور 32-vCPU أكبر من الفائدة                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest` | `macos-node` على `openclaw/openclaw`؛ وتعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |

## المعادِلات المحلية

```bash
pnpm changed:lanes   # فحص مصنّف المسارات المتغيرة المحلي لـ origin/main...HEAD
pnpm check:changed   # بوابة محلية ذكية: typecheck/lint/tests متغيرة حسب مسار الحدود
pnpm check          # بوابة محلية سريعة: production tsgo + lint مجزأ + fast guards متوازية
pnpm check:test-types
pnpm check:timed    # البوابة نفسها مع توقيتات لكل مرحلة
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # اختبارات vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # تنسيق الوثائق + lint + الروابط المعطلة
pnpm build          # بناء dist عندما تكون مسارات CI artifact/build-smoke مهمة
pnpm ci:timings                               # تلخيص أحدث تشغيل push CI على origin/main
pnpm ci:timings:recent                        # مقارنة تشغيلات CI الناجحة الأخيرة على main
node scripts/ci-run-timings.mjs <run-id>      # تلخيص وقت التنفيذ الكلي ووقت الانتظار وأبطأ المهام
node scripts/ci-run-timings.mjs --latest-main # تجاهل ضوضاء issues/comments واختيار push CI على origin/main
node scripts/ci-run-timings.mjs --recent 10   # مقارنة تشغيلات CI الناجحة الأخيرة على main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات الإصدار](/ar/install/development-channels)

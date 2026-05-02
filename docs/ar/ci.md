---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تستكشف أخطاء فحص GitHub Actions فاشل وتصلحها.
    - أنت تنسّق تشغيلًا أو إعادة تشغيل للتحقق من الإصدار
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط وظائف CI، وبوابات النطاق، ومظلات الإصدارات، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-02T07:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

يعمل التكامل المستمر (CI) في OpenClaw عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تعيش تغطية Plugin الخاصة بالإصدار فقط في سير عمل [`Plugin ما قبل الإصدار`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`التحقق الكامل من الإصدار`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                           | الغرض                                                                                         | متى تعمل                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI             | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                          | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج دون تبعيات مقابل تحذيرات npm                                            | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                              | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip الإنتاجية للتبعيات فقط بالإضافة إلى حارس قائمة السماح للملفات غير المستخدمة       | تغييرات ذات صلة بـ Node             |
| `build-artifacts`                | بناء `dist/`، وواجهة Control UI، وفحوصات artifacts المبنية، وartifacts قابلة لإعادة الاستخدام لاحقًا | تغييرات ذات صلة بـ Node             |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات Plugin المضمّنة/عقود Plugin/البروتوكول                    | تغييرات ذات صلة بـ Node             |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى شظايا مع نتيجة فحص تجميعية مستقرة                            | تغييرات ذات صلة بـ Node             |
| `checks-node-core-test`          | شظايا اختبارات Node الأساسية، باستثناء مسارات القنوات والمضمّنة والعقود والإضافات             | تغييرات ذات صلة بـ Node             |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، وlint، والحراس، وأنواع الاختبارات، وsmoke صارم | تغييرات ذات صلة بـ Node             |
| `check-additional`               | شظايا البنية، والحدود، وحراس سطح الإضافة، وحدود الحزم، ومراقبة Gateway                       | تغييرات ذات صلة بـ Node             |
| `build-smoke`                    | اختبارات smoke لواجهة CLI المبنية وsmoke لذاكرة بدء التشغيل                                  | تغييرات ذات صلة بـ Node             |
| `checks`                         | أداة تحقق لاختبارات قنوات artifacts المبنية                                                   | تغييرات ذات صلة بـ Node             |
| `checks-node-compat-node22`      | مسار بناء وsmoke للتوافق مع Node 22                                                           | تشغيل CI يدوي للإصدارات             |
| `check-docs`                     | تنسيق الوثائق، وlint، وفحوصات الروابط المعطلة                                                | تغيرت الوثائق                       |
| `skills-python`                  | Ruff + pytest للمهارات المدعومة بـ Python                                                     | تغييرات ذات صلة بمهارات Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows بالإضافة إلى انحدارات محددات استيراد وقت التشغيل المشتركة | تغييرات ذات صلة بـ Windows          |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام artifacts المبنية المشتركة                          | تغييرات ذات صلة بـ macOS            |
| `macos-swift`                    | Swift lint، والبناء، والاختبارات لتطبيق macOS                                                 | تغييرات ذات صلة بـ macOS            |
| `android`                        | اختبارات وحدات Android لكلتا النكهتين بالإضافة إلى بناء APK تصحيحي واحد                       | تغييرات ذات صلة بـ Android          |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                             | نجاح CI الرئيسي أو تشغيل يدوي       |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` هو خطوات داخل هذه المهمة، وليس مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام artifacts ومصفوفة المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد أن يكون البناء المشترك جاهزًا.
4. تتوسع بعد ذلك مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تجاوزتها عملية أحدث بالحالة `cancelled` عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الشظايا التجميعية `!cancelled() && always()` بحيث تظل تبلّغ عن إخفاقات الشظايا العادية، لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي مرقّم بالإصدار (`CI-v7-*`) حتى لا يتمكن عالق من جهة GitHub في مجموعة انتظار قديمة من حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node بالإضافة إلى lint لسير العمل، لكنها لا تفرض بمفردها عمليات بناء Windows أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات محددة بتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات مختارة رخيصة على fixtures لاختبارات core، وتعديلات ضيقة على مساعدين/توجيه اختبارات عقود Plugin** تستخدم مسار بيان سريع لـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار artifacts البناء، وتوافق Node 22، وعقود القنوات، وشظايا core الكاملة، وشظايا Plugin المضمّنة، ومصفوفات الحراسة الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعدين التي تمرّنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة بنطاق أغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي تشغيل npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تشغّل ذلك المسار؛ تبقى تغييرات المصدر وPlugin وinstall-smoke والاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تُقسّم أو تُوازن أبطأ عائلات اختبارات Node بحيث تبقى كل مهمة صغيرة دون حجز زائد للمشغّلات: تعمل عقود القنوات كثلاث شظايا موزونة، وتُقرن مسارات وحدات core الصغيرة، ويعمل auto-reply كأربعة عمال متوازنين (مع تقسيم الشجرة الفرعية للرد إلى شظايا agent-runner وdispatch وcommands/state-routing)، وتُوزّع إعدادات Gateway/Plugin العاملية على مهام Node العاملية الحالية الخاصة بالمصدر بدل انتظار artifacts المبنية. تستخدم اختبارات المتصفح الواسعة وQA والوسائط وPlugin المتنوعة إعدادات Vitest المخصصة لها بدل الالتقاط العام المشترك لـ Plugin. تسجل شظايا أنماط التضمين إدخالات توقيت باستخدام اسم شظية CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وشظية مفلترة. يُبقي `check-additional` عمل ترجمة/كاناري حدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تشغّل شظية حارس الحدود حراسها الصغار المستقلين بالتوازي داخل مهمة واحدة. تعمل مراقبة Gateway، واختبارات القنوات، وشظية حدود دعم core بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلاً من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيحيًا لـ Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ ما زال مسار اختبار وحداتها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيحي مكررة عند كل دفع ذي صلة بـ Android.

تشغّل شظية `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية للتبعيات فقط مثبتة على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر الإصدار في pnpm لتثبيت `dlx`) والأمر `pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مقابل `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مُراجع أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية المقصودة، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يقوم بسحب أو تنفيذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى commit في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المطبّع إلى hook OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام للملاحظة، وليس للتسليم افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في الموجه الخاص به، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للتنفيذ أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. ينبغي أن تؤدي عمليات الفتح الروتينية، والتعديلات، وضجيج bot، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل commit كبيانات غير موثوقة طوال هذا المسار. هي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادي لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وsmoke البناء، وفحوصات الوثائق، وSkills Python، وWindows، وmacOS، وControl UI i18n. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ يمكّن مظلّة الإصدار الكامل Android بتمرير `include_android=true`. فحوصات Plugin ما قبل الإصدار الساكنة، وشظية `agentic-plugins` الخاصة بالإصدار فقط، ومسح دفعة الإضافات الكامل، ومسارات Docker الخاصة بـ Plugin ما قبل الإصدار مستبعدة من CI. تعمل مجموعة Docker ما قبل الإصدار فقط عندما يرسل `التحقق الكامل من الإصدار` سير عمل `Plugin ما قبل الإصدار` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى مجموعة كاملة لمرشح إصدار بسبب دفع أو تشغيل طلب سحب آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدع موثوق تشغيل ذلك الرسم البياني ضد فرع أو وسم أو SHA commit كامل، مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، وفحوصات البروتوكول/العقد/الحزم السريعة، وفحوصات عقد القنوات المجزأة، وأجزاء `check` باستثناء الفحص اللغوي، وأجزاء وتجميعات `check-additional`، ومتحققات تجميع اختبارات Node، وفحوصات التوثيق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم تمهيد install-smoke نظام Ubuntu المستضاف على GitHub لكي تتمكن مصفوفة Blacksmith من الدخول في الطابور مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء Plugin الأخف وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المضمنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي لوحدة المعالجة المركزية بحيث إن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلفة وقت طابور 32-vCPU كانت أكثر مما وفرت)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الشامل لـ"تشغيل كل شيء قبل الإصدار". يقبل فرعا أو وسما أو SHA كاملا للالتزام، ويشغل سير عمل `CI` اليدوي بذلك الهدف، ويشغل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغل `OpenClaw Release Checks` لاختبار التثبيت، وقبول الحزمة، ومجموعات مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغل أيضا `NPM Telegram Beta E2E` مقابل الأثر `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات التعريفية، والآثار، ومقابض
إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يغير الحالة. شغله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح تمهيد
OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويشغل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغل
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعا أو وسوما، وليست SHA خامة للالتزامات. يدفع
المساعد فرعا مؤقتا `release-ci/<sha>-...` عند SHA الهدف،
ويشغل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل المتحقق الشامل أيضا إذا شغل أي سير عمل فرعي عند
SHA مختلفة.

يتحكم `release_profile` في اتساع الاختبارات الحية/المزودين الممرر إلى فحوصات الإصدار. تضبط
مهام سير عمل الإصدار اليدوية القيمة الافتراضية على `stable`؛ استخدم `full` فقط عندما
تريد عمدا مصفوفة المزود/الوسائط الاستشارية الواسعة.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزودين/الخلفيات المستقرة.
- يشغل `full` مصفوفة المزود/الوسائط الاستشارية الواسعة.

يسجل الشامل معرفات التشغيل الفرعية التي شغلها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أعيد تشغيل سير عمل فرعي وتحول إلى أخضر، فأعد تشغيل مهمة متحقق الأصل فقط لتحديث نتيجة الشامل وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للطفل الكامل العادي لـ CI فقط، و`plugin-prerelease` لطفل ما قبل إصدار Plugin فقط، و`release-checks` لكل طفل إصدار، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على الشامل. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker الحي/E2E لمسار الإصدار وجزء قبول الحزمة. هذا يبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل الشامل الأقدم. يلغي مراقب الأصل أي سير عمل فرعي شغله بالفعل
عند إلغاء الأصل، لذلك لا ينتظر تحقق main الأحدث خلف تشغيل فحوصات إصدار
قديم مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل
المركزة على `cancel-in-progress: false`.

## أجزاء الاختبارات الحية وE2E

يحافظ الطفل الحي/E2E الخاص بالإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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
- أجزاء وسائط الصوت/الفيديو المقسمة وأجزاء الموسيقى المفلترة حسب المزود

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات المزود الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تظل أسماء أجزاء التجميع `native-live-extensions-o-z`، و`native-live-extensions-media`، و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية دفعة واحدة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ ولا تتحقق مهام الوسائط إلا من الثنائيات قبل الإعداد. أبق مجموعات الاختبارات الحية المدعومة بـ Docker على مشغلات Blacksmith العادية؛ فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker المتداخلة.

تستخدم شظايا النموذج المباشر/الخلفية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل إيداع محدد. يبني سير عمل الإصدار المباشر تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker المباشر، وGateway المقسم حسب المزوّد، وخلفية CLI، وربط ACP، وحاضنة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شظايا Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل، بحيث يفشل الحاوي العالق أو مسار التنظيف بسرعة بدلاً من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الشظايا بناء هدف Docker للمصدر الكامل بشكل مستقل، فإن تشغيل الإصدار مهيأ على نحو خاطئ وسيهدر وقت التنفيذ في عمليات بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من ملف tarball واحد عبر حاضنة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package`‏ `workflow_ref`، ويحل مرشح حزمة واحداً، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance`‏ `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد ملف tarball، ويجهز صور Docker ذات ملخصات الحزمة عند الحاجة، ويشغل مسارات Docker المحددة مقابل تلك الحزمة بدلاً من حزم نسخة سير العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` موجهة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker موجهة متوازية ذات آثار فريدة.
3. يستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحداً؛ ويمكن لإرسال Telegram المستقل أن يظل قادراً على تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحات

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول إصدارات beta/المستقرة المنشورة.
- يحزم `source=ref` فرعاً أو وسماً أو SHA إيداع كاملاً موثوقاً في `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الإيداع المحدد قابل للوصول من تاريخ فروع المستودع أو من وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عبر HTTPS؛ ويكون `package_sha256` مطلوباً.
- ينزل `source=artifact` ملف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختيارياً، لكن ينبغي توفيره للآثار المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحاضنة الموثوق الذي يشغل الاختبار. `package_ref` هو إيداع المصدر الذي يتم حزمه عندما يكون `source=ref`. يتيح ذلك لحاضنة الاختبار الحالية التحقق من إيداعات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم الملف التعريفي `package` تغطية Plugin دون اتصال، بحيث لا يكون تحقق الحزمة المنشورة مشروطاً بتوفر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

للسياسة المخصصة لاختبار التحديث وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المجهز، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=release-history`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. يبقي ذلك إثبات ترحيل الحزمة، والتحديث، وتنظيف اعتماديات Plugin القديمة، وPlugin دون اتصال، وتحديث Plugin، وTelegram على ملف tarball نفسه للحزمة المحلولة. تظل فحوصات الإصدار عبر أنظمة التشغيل تغطي الإلحاق، والمثبت، وسلوك المنصة الخاص بأنظمة التشغيل؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث من قبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل. في قبول الحزمة، يكون ملف tarball المحلول `package-under-test` هو المرشح دائماً ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest` افتراضياً؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. اضبط `published_upgrade_survivor_baselines=release-history` لتوسيع المسار عبر مصفوفة تاريخ مزالة التكرار: أحدث ستة إصدارات مستقرة، و`2026.4.23`، وأحدث إصدار مستقر قبل `2026-03-15`. اضبط `published_upgrade_survivor_scenarios=reported-issues` لتوسيع خطوط الأساس نفسها عبر تجهيزات على هيئة مشكلات لتكوين Feishu، وملفات bootstrap/persona المحفوظة، ومسارات سجل tilde، وجذور اعتماديات Plugin القديمة الراكدة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديثات المنشورة على نحو شامل، لا سعة CI العادية لفحص الإصدار الكامل. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد مع `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الجديدة للحزمة والمثبت أيضاً من أن الحزمة المثبتة تستطيع استيراد تجاوز browser-control من مسار Windows خام مطلق. يستخدم دخان دورة وكيل OpenAI عبر أنظمة التشغيل افتراضياً `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا `openai/gpt-5.5`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 المفضل.

### نوافذ التوافق القديمة

يملك قبول الحزمة نوافذ توافق قديمة محدودة للحزم المنشورة مسبقاً. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية الخاصة باستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch`‏ `pnpm.patchedDependencies` المفقودة من تجهيز git الزائف المشتق من tarball وقد يسجل `update.channel` محفوظاً مفقوداً؛
- قد تقرأ اختبارات Plugin الدخانية مواقع سجل تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التكوين مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضاً بشأن ملفات ختم بيانات تعريف البناء المحلي التي شُحنت بالفعل. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلاً من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة، والإصدار، وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثاره الخاصة بـ Docker:‏ `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغل **المسار السريع** لطلبات السحب التي تمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام دخان Docker. لا تحجز تغييرات Plugin المضمنة في المصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغل e2e حاوية gateway-network، ويتحقق من وسيط بناء Plugin مضمّن، ويشغل ملف تعريف Docker المحدود لـ Plugin المضمن ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع حد منفصل لكل تشغيل Docker في كل سيناريو).
- يبقي **المسار الكامل** تثبيت حزمة QR وتغطية Docker/التحديث للمثبت للتشغيلات الليلية المجدولة، والإرسالات اليدوية، وفحوصات الإصدار باستدعاء سير العمل، وطلبات السحب التي تمس فعلاً أسطح المثبت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة دخان Dockerfile جذرية من GHCR لهدف SHA واحد، ثم يشغل تثبيت حزمة QR، ودخان Dockerfile/Gateway الجذري، ودخان المثبت/التحديث، وDocker E2E السريع لـ Plugin المضمن كمهام منفصلة بحيث لا ينتظر عمل المثبت خلف دخان الصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك إيداعات الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يبقي سير العمل دخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يخضع دخان مزود الصور لتثبيت Bun العام البطيء بشكل منفصل لـ `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لإرسالات `Install Smoke` اليدوية أن تختار تفعيله، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقاً صورة live-test مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف tarball لـ npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغل Node/Git بسيط لمسارات المثبت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات المجموعة الرئيسية للمسارات العادية.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات مجموعة النهاية الحساسة للمزوّدين.                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات الحية المتزامنة حتى لا يقيّد المزوّدون السرعة.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | حد مسارات تثبيت npm المتزامنة.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد مسارات الخدمات المتعددة المتزامنة.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | التدرّج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم التدرّج.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/نهاية محددة حدودًا أشد.                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط | يطبع `1` خطة المجدول من دون تشغيل المسارات.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى اختبار التنظيف السريع حتى تتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حدّه الفعلي أن يبدأ مع ذلك من مجموعة فارغة، ثم يعمل وحده حتى يحرر السعة. يجري التجميع المحلي فحوصات تمهيدية لـ Docker، ويزيل حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة، ويحفظ توقيتات المسارات للترتيب من الأطول أولًا، ويتوقف افتراضيًا عن جدولة مسارات مجمّعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات GitHub وملخصات. فهو إما يغلّف OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر حزمة من التشغيل الحالي، أو ينزّل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور GHCR Docker E2E العارية/الوظيفية الموسومة ببصمة الحزمة عبر ذاكرة طبقات Docker المؤقتة في Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور بصمة الحزمة الموجودة بدلًا من إعادة البناء. تتم إعادة محاولة سحب صور Docker بمهلة محددة تبلغ 180 ثانية لكل محاولة، حتى يعاد سريعًا سحب دفق سجل/ذاكرة مؤقتة عالق بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker الخاصة بالإصدار كوظائف مجزأة أصغر مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفّذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار لمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبّت المزوّد.

يُضمّن OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل مؤقت في شبكة npm.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المجهزة بدلًا من وظائف الأجزاء، مما يبقي تصحيح مسار فاشل محدودًا بوظيفة Docker مستهدفة واحدة ويجهّز أثر الحزمة أو ينزّله أو يعيد استخدامه لذلك التشغيل؛ إذا كان أحد المسارات المحددة مسار Docker حيًا، تبني الوظيفة المستهدفة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر GitHub المولّدة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المجهزة عندما تكون تلك القيم موجودة، بحيث يستطيع المسار الفاشل إعادة استخدام الحزمة والصور نفسها تمامًا من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` تغطية أغلى للمنتج/الحزمة، لذلك فهو سير عمل منفصل يرسله `Full Release Validation` أو مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وإرسالات CI اليدوية المستقلة تلك المجموعة معطّلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال extension؛ وتشغّل وظائف التجزئة تلك ما يصل إلى مجموعتي إعدادات Plugin في وقت واحد مع عامل Vitest واحد لكل مجموعة وحجم ذاكرة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد وظائف CI إضافية. يجمع مسار الإصدار التمهيدي لـ Docker الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لوظائف مدتها من دقيقة إلى ثلاث دقائق.

## مختبر QA

لدى مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي.

- يعمل سير عمل `Parity gate` عند تغييرات PR المطابقة والإرسال اليدوي؛ وهو يبني وقت تشغيل QA الخاص ويقارن حزم الوكلاء الوهمية GPT-5.5 وOpus 4.6.
- يعمل سير عمل `QA-Lab - All Lanes` ليلًا على `main` وعند الإرسال اليدوي؛ وهو يوزّع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كوظائف متوازية. تستخدم الوظائف الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram باستخدام المزوّد الوهمي الحتمي والنماذج المؤهلة وهميًا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يكون عقد القناة معزولًا عن زمن استجابة النموذج الحي وبدء تشغيل provider-plugin العادي. يعطّل Gateway النقل الحي البحث في الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النموذج الحي، والمزوّد الأصلي، ومزوّد Docker المنفصلة اتصال المزوّدين.

تستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، وتضيف `--fail-fast` فقط عندما تدعمه CLI في النسخة المسحوبة. يظل الإعداد الافتراضي لـ CLI ومدخل سير العمل اليدوي `all`؛ وإرسال `matrix_profile=all` اليدوي يجزّئ دائمًا تغطية Matrix الكاملة إلى وظائف `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات مختبر QA الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كوظائف مسارات متوازية، ثم تنزّل كلا الأثرين إلى وظيفة تقرير صغيرة للمقارنة النهائية للتكافؤ.

لا تضع مسار دمج PR خلف `Parity gate` إلا إذا كان التغيير يمس فعلًا وقت تشغيل QA، أو تكافؤ حزم النماذج، أو سطحًا يملكه سير عمل التكافؤ. بالنسبة لإصلاحات القنوات أو الإعدادات أو الوثائق أو اختبارات الوحدة العادية، عامله كإشارة اختيارية واتبع أدلة CI/الفحوصات ذات النطاق بدلًا من ذلك.

## CodeQL

سير عمل `CodeQL` هو عمدًا ماسح أمان ضيق للمرور الأول، وليس مسحًا كاملًا للمستودع. تعمل تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة على فحص كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمان عالية الثقة مرشحة إلى `security-severity` عالٍ/حرج.

تبقى حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لـ PR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وبيئة الحماية، وcron، وخط أساس gateway                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل channel plugin، وgateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | تثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وأسطح الثقة لعقد حزمة Plugin SDK                         |

### أجزاء الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — جزء أمان Android مجدول. يبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة سير العمل. يرفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، ويرشح نتائج بناء التبعيات من SARIF المرفوع، ويرفع تحت `/codeql-critical-security/macos`. يبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على زمن التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. يشغّل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة خطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة به أصغر عمدًا من الملف المجدول: تشغّل طلبات PR غير المسودة فقط أجزاء `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكلاء وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/بيئة الحماية/الأمان، ووقت تشغيل القنوات الأساسية وchannel plugin المضمّن، وبروتوكول gateway/طرائق الخادم، وغراء وقت تشغيل/SDK الذاكرة، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو تغييرات وقت تشغيل رد Plugin SDK. تشغّل تغييرات إعدادات CodeQL وسير عمل الجودة جميع أجزاء جودة PR الاثني عشر.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الجانبية الضيقة هي خطافات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                  | السطح                                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وصندوق العزل وcron وGateway                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات والترحيل والتطبيع وعقود الإدخال/الإخراج                                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوجيه النموذج/الموفر، وتوجيه الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء SDK المستعارة لذاكرة Plugin، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات                                  |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في SDK الخاص بـPlugin، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/المحادثة                      |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع فهرس النماذج، ومصادقة الموفر واكتشافه، وتسجيل وقت تشغيل الموفر، وافتراضيات/فهارس الموفر، وسجلات الويب/البحث/الجلب/التضمين                                      |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل الجلب/البحث الأساسيين على الويب، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                        |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول SDK الخاص بـPlugin                                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر SDK المنشور الخاص بـPlugin على جانب الحزمة، ومساعدات عقد حزمة Plugin                                                                                                 |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسيع CodeQL الخاص بـSwift وPython وPlugin المضمّنة بوصفه عمل متابعة محدد النطاق أو مجزأ فقط بعد أن تصبح الملفات الجانبية الضيقة مستقرة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل التوثيق

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء الوثائق الحالية متوافقة مع التغييرات التي دُمجت مؤخرا. لا يملك جدولة صافية: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل التنفيذ عندما يكون `main` قد تقدم، أو عندما يكون تشغيل آخر غير متخطى من Docs Agent قد أُنشئ خلال الساعة الأخيرة. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـDocs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر تمريرة توثيق.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولة صافية: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يطلقه، لكنه يتخطى التنفيذ إذا كان استدعاء آخر عبر تشغيل سير العمل قد عمل بالفعل أو ما زال يعمل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعا لكامل الحزمة، ويسمح لـCodex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير كامل الحزمة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كانت هناك اختبارات فاشلة في خط الأساس، فقد يصلح Codex الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير كامل الحزمة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع الروبوت، يعيد المسار تأسيس التصحيح الذي تم التحقق منه، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع مجددا؛ ويتم تخطي التصحيحات القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على موقف أمان إسقاط sudo نفسه مثل وكيل التوثيق.

### العلاقات المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يكون افتراضيا في وضع التشغيل الجاف، ولا يغلق إلا علاقات PR المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن علاقة PR التي هبطت مدمجة، وأن كل علاقة مكررة لها إما مسألة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغّل فحص أنواع إنتاج النواة واختبارات النواة، إضافة إلى فحص النواة وقواعد الحراسة؛
- تغييرات اختبارات النواة فقط تشغّل فحص أنواع اختبارات النواة فقط، إضافة إلى فحص النواة؛
- تغييرات إنتاج الامتداد تشغّل فحص أنواع إنتاج الامتداد واختبارات الامتداد، إضافة إلى فحص الامتداد؛
- تغييرات اختبارات الامتداد فقط تشغّل فحص أنواع اختبارات الامتداد، إضافة إلى فحص الامتداد؛
- تغييرات SDK العام الخاص بـPlugin أو عقد Plugin تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على تلك العقود الأساسية (تبقى جولات Vitest الخاصة بالامتدادات عملا اختباريا صريحا)؛
- زيادات الإصدار التي تخص بيانات الإصدار الوصفية فقط تشغّل فحوصا موجهة للإصدار/الإعدادات/اعتماديات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

تعيش منطقية توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهي أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. إعدادات تسليم غرفة المجموعة المشتركة هي إحدى الخرائط الصريحة: تمر تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل أي تغيير افتراضي مشترك قبل أول دفع لعلاقة PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا على مستوى العدة بما يكفي بحيث لا تكون المجموعة الرخيصة المرسومة وكيلا موثوقا.

## التحقق عبر Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقا مسخنا جديدا للإثبات الواسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من علاقة PR؛ أوقف ذلك الصندوق وسخّن صندوقا جديدا بدلا من تصحيح فشل اختبار المنتج. لعلاقات PR ذات الحذف الكبير المقصود، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذاك.

ينهي `pnpm testbox:run` أيضا استدعاء Blacksmith CLI محليا يبقى في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على غير المعتاد.

Crabbox هو مسار الصندوق البعيد الثاني المملوك للمستودع لإثبات Linux عندما يكون Blacksmith غير متاح أو عندما تكون السعة السحابية المملوكة مفضلة. سخّن صندوقا، واروه عبر سير عمل المشروع، ثم شغّل الأوامر عبر Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

تملك `.crabbox.yaml` افتراضيات الموفر والمزامنة والإرواء عبر GitHub Actions. تستثني `.git` المحلي حتى يحتفظ checkout الخاص بـActions الذي تمت تهيئته ببيانات Git البعيدة الخاصة به بدلا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية للمشرف، وتستثني كذلك مصنوعات وقت التشغيل/البناء المحلية التي لا ينبغي نقلها أبدا. تملك `.github/workflows/crabbox-hydrate.yml` عملية checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية التي تستند إليها لاحقا أوامر `crabbox run --id <cbx_id>`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

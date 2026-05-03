---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح أخطاء فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل التحقق من صحة الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط وظائف CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-03T21:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

CI الخاص بـ OpenClaw يعمل عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` النطاق الذكي عن قصد وتوسّع الرسم البياني الكامل لمرشحي الإصدارات والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدارات فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                           | الغرض                                                                                                       | متى تعمل                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | كشف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                              | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | كشف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                          | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف القفل الإنتاجي دون تبعيات مقابل تحذيرات npm                                                       | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                                            | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip إنتاجية للتبعيات فقط مع حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات ذات صلة بـ Node             |
| `build-artifacts`                | بناء `dist/`، وواجهة Control UI، وفحوصات مخرجات البناء، ومخرجات قابلة لإعادة الاستخدام للمراحل اللاحقة     | تغييرات ذات صلة بـ Node             |
| `checks-fast-core`               | مسارات صحة سريعة على Linux مثل فحوصات المضمّن/عقد Plugin/البروتوكول                                         | تغييرات ذات صلة بـ Node             |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                                                     | تغييرات ذات صلة بـ Node             |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات، والمضمّن، والعقود، والإضافات                         | تغييرات ذات صلة بـ Node             |
| `check`                          | مكافئ البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، واختبار دخان صارم | تغييرات ذات صلة بـ Node             |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المجزأ، وحراس الإضافات، وحدود الحزم، ومراقبة Gateway                       | تغييرات ذات صلة بـ Node             |
| `build-smoke`                    | اختبارات دخان CLI المبني واختبار دخان ذاكرة البدء                                                           | تغييرات ذات صلة بـ Node             |
| `checks`                         | مدقق اختبارات قنوات مخرجات البناء                                                                           | تغييرات ذات صلة بـ Node             |
| `checks-node-compat-node22`      | مسار بناء ودخان لتوافق Node 22                                                                              | تشغيل CI يدوي للإصدارات             |
| `check-docs`                     | تنسيق الوثائق وفحصها وفحوصات الروابط المكسورة                                                               | تغيرت الوثائق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                 | تغييرات ذات صلة بـ Skills في Python |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows مع تراجعات محددات استيراد وقت التشغيل المشتركة                | تغييرات ذات صلة بـ Windows          |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام مخرجات البناء المشتركة                                          | تغييرات ذات صلة بـ macOS            |
| `macos-swift`                    | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                                    | تغييرات ذات صلة بـ macOS            |
| `android`                        | اختبارات وحدات Android لكلا النكهتين مع بناء APK تصحيح واحد                                                | تغييرات ذات صلة بـ Android          |
| `test-performance-agent`         | تحسين اختبارات Codex البطيئة يوميًا بعد نشاط موثوق                                                          | نجاح CI الرئيسي أو تشغيل يدوي       |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات موفر وهمي، وملف تعريف عميق، وGPT 5.4 حي              | تشغيل مجدول ويدوي                   |

## ترتيب الفشل السريع

1. يحدد `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليسا مهمتين مستقلتين.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مصفوفات المخرجات والمنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. تتفرع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزتها دفعة أحدث عند وصول دفع جديد إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات تجميع الأجزاء `!cancelled() && always()` كي تستمر في الإبلاغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف في الطابور بعد أن يكون سير العمل كله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) حتى لا يستطيع عالق من جهة GitHub في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات الحزمة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي كشف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node بالإضافة إلى فحص سير العمل، لكنها لا تفرض بذاتها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات المنصات هذه محددة النطاق بتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات مختارة رخيصة على تجهيزات اختبارات النواة، وتعديلات ضيقة على مساعدات/اختبارات توجيه عقد Plugin** تستخدم مسار بيان سريعًا خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار مخرجات البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمّنة، ومصفوفات الحراسة الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدات التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق إلى أغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدات تشغيل npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير ذات الصلة، وPlugin، ودخان التثبيت، والاختبارات فقط على مسارات Linux Node.

تُقسّم أو تُوازن أبطأ عائلات اختبارات Node كي تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتعمل مسارات النواة السريعة/الداعمة كلٌ على حدة، وتُقسّم بنية وقت تشغيل النواة بين أجزاء الحالة والعملية/التكوين، وتعمل الاستجابة التلقائية كعمال متوازنين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء مشغل الوكيل، والإرسال، والأوامر/توجيه الحالة)، وتُقسّم تكوينات Gateway/الخادم الوكيلية عبر مسارات الدردشة/المصادقة/النموذج/http-plugin/وقت التشغيل/بدء التشغيل بدلًا من انتظار مخرجات البناء. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة تكوينات Vitest المخصصة لها بدلًا من تجميع Plugin المشترك. تسجل أجزاء أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، حتى يستطيع `.artifacts/vitest-shard-timings.json` تمييز تكوين كامل عن جزء مرشح. يبقي `check-additional` عمل ترجمة/كناري حدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُخطط قائمة حراس الحدود عبر أربعة أجزاء مصفوفة، يشغل كل منها حراسًا مستقلين مختارين بالتوازي ويطبع توقيتات لكل فحص، بما في ذلك `pnpm prompt:snapshots:check` كي يُثبّت انحراف مطالبات مسار Codex السعيد في وقت التشغيل إلى طلب السحب الذي سببه. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم النواة بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK تصحيح Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ ما يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيح مكررة عند كل دفع ذي صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية للتبعيات فقط مثبتة على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip للملفات الإنتاجية غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مُراجع أو يترك إدخالًا قديمًا في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب كود طلبات السحب غير الموثوق ولا ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المسائل وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المسائل؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عن قصد تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المطبع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا، أو قابلًا للتنفيذ، أو خطرًا، أو مفيدًا تشغيليًا. ينبغي أن تؤدي عمليات الفتح، والتحرير، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub، وتعليقاته، وأجسامه، ونصوص المراجعات، وأسماء الفروع، ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. هي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تعمل عمليات تشغيل CI اليدوية برسم الوظائف نفسه مثل CI العادي، لكنها تفرض تشغيل كل مسار غير Android محدود النطاق: أجزاء Linux Node، وأجزاء bundled-plugin، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، وControl UI i18n. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكامل Android بتمرير `include_android=true`. تُستثنى من CI الفحوصات الثابتة لما قبل إصدار Plugin، وجزء `agentic-plugins` الخاص بالإصدار فقط، والمسح الكامل بدُفعة الامتدادات، ومسارات Docker لما قبل إصدار Plugin. لا تعمل حزمة Docker لما قبل الإصدار إلا عندما يطلق `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة بحيث لا تُلغى حزمة كاملة لمرشح إصدار بواسطة تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم مقابل فرع أو وسم أو SHA كامل لتعهد، مع استخدام ملف سير العمل من مرجع الإطلاق المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | الوظائف                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ووظائف الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، وفحوصات البروتوكول/العقد/bundled السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء `check-additional` وتجميعاتها، ومتحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم install-smoke preflight Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الامتدادات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات bundled plugin، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي للمعالج إلى درجة أن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker لـ install-smoke (كلف وقت انتظار قائمة 32-vCPU أكثر مما وفر)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ وتعود الفروع المتشعبة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ وتعود الفروع المتشعبة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## أداء OpenClaw

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميًا على `main` ويمكن تشغيله يدويًا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس التشغيل اليدوي عادةً مرجع سير العمل. عيّن `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تطبيق سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث بحسب المرجع المختبر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف التعريفي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبت، وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل ببناء محلي مع مصادقة مزيفة حتمية ومتوافقة مع OpenAI.
- `mock-deep-profile`: تشكيل CPU/heap/trace لمواضع البطء في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI حقيقية باستخدام `openai/gpt-5.4`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا مجسات مصدر أصلية لـ OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-plugin؛ وحلقات hello متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء تشغيل CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، وبجواره JSON الخام.

يرفع كل مسار عناصر GitHub الأثرية. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأً، يثبت سير العمل أيضًا `report.json`، و`report.md`، والحزم، و`index.md`، وعناصر مجس المصدر الأثرية في `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبر الحالي بصيغة `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لـ "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا لتعهد، ويطلق سير عمل `CI` اليدوي مع ذلك الهدف، ويطلق `Plugin Prerelease` لإثباتات plugin/package/static/Docker الخاصة بالإصدار فقط، ويطلق `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وحزم مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` مقابل عنصر `release-package-under-test` الأثري من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، واختلافات الملفات التعريفية، والعناصر الأثرية، ومقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي المُغيّر. شغّله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
الفحص التمهيدي لـ OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويطلق `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويطلق
`Plugin ClawHub Release` لنفس SHA الإصدار، وبعد ذلك فقط يطلق
`OpenClaw NPM Release` باستخدام `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات تعهد مثبت على فرع سريع الحركة، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إطلاق سير عمل GitHub فروعًا أو وسومًا، لا SHA خامًا للتعهدات. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويطلق `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل تابع يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل متحقق المظلة أيضًا إذا شُغّل أي سير عمل تابع عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/المزوّد الذي يُمرَّر إلى فحوصات الإصدار. تسير مسارات عمل الإصدار اليدوية افتراضياً على `stable`؛ استخدم `full` فقط عندما تريد عمداً مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

- يُبقي `minimum` أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّدين/الخلفيات المستقرة.
- يشغّل `full` مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

يسجّل المسار الجامع معرفات تشغيل المهام الفرعية التي تم إرسالها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج التشغيل الفرعية الحالية وتلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أُعيد تشغيل مسار عمل فرعي وأصبح أخضر، فأعد تشغيل مهمة التحقق الأصلية فقط لتحديث نتيجة المسار الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الفرعي العادي الخاص بـ CI الكامل فقط، و`plugin-prerelease` للفرع الفرعي الخاص بالإصدار التمهيدي للـ Plugin فقط، و`release-checks` لكل فرع إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المسار الجامع. هذا يُبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع مسار العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر تلك القطعة الأثرية إلى كل من مسار عمل Docker الخاص بمسار الإصدار live/E2E وشريحة قبول الحزمة. هذا يُبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المسار الجامع الأقدم. يلغي مراقب الأصل أي مسار عمل فرعي
كان قد أرسله عندما يُلغى الأصل، لذلك لا ينتظر تحقق main الأحدث
خلف تشغيل فحص إصدار قديم مدته ساعتان. يبقى تحقق فروع/وسوم الإصدار
ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## شرائح live وE2E

يحافظ فرع live/E2E الخاص بالإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشرائح مسماة عبر `scripts/test-live-shard.mjs` بدلاً من مهمة تسلسلية واحدة:

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
- شرائح وسائط صوت/فيديو مقسمة وشرائح موسيقى مفلترة حسب المزوّد

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات مزوّدي live البطيئة أسهل في إعادة التشغيل والتشخيص. تبقى أسماء الشرائح التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شرائح وسائط live الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة مسار عمل `Live Media Runner Image`. تثبّت هذه الصورة `ffmpeg` و`ffprobe` مسبقاً؛ ولا تتحقق مهام الوسائط إلا من الملفات الثنائية قبل الإعداد. أبقِ مجموعات live المدعومة بـ Docker على مشغّلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker المتداخلة.

تستخدم شرائح نموذج/خلفية live المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل commit محدد. يبني مسار عمل إصدار live تلك الصورة ويدفعها مرة واحدة، ثم تعمل شرائح نموذج live في Docker، وGateway المقسّم حسب المزوّد، وخلفية CLI، وربط ACP، وحزام Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شرائح Gateway Docker حدود `timeout` صريحة على مستوى السكربت دون مهلة مهمة مسار العمل بحيث يفشل المسار سريعاً إذا علقت حاوية أو مسار تنظيف بدلاً من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الشرائح بناء هدف Docker الكامل للمصدر بشكل مستقل، فإن تشغيل الإصدار مُعدّ بشكل خاطئ وسيهدر وقتاً فعلياً على بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو: "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهي تختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف واحد عبر حزام Docker E2E نفسه الذي يستخدمه المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` المرجع `workflow_ref`، ويحل مرشح حزمة واحداً، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما كقطعة `package-under-test` الأثرية، ويطبع المصدر، ومرجع مسار العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل مسار العمل القابل لإعادة الاستخدام تلك القطعة الأثرية، ويتحقق من جرد الأرشيف، ويحضّر صور Docker ذات بصمة الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلاً من حزم نسخة مسار العمل. عندما يحدد ملف تعريفي عدة `docker_lanes` مستهدفة، يجهّز مسار العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزّع تلك المسارات كمهام Docker مستهدفة متوازية بقطع أثرية فريدة.
3. يستدعي `package_telegram` اختيارياً `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت قطعة `package-under-test` الأثرية نفسها عندما يكون قبول الحزمة قد حل واحدة؛ ولا يزال بإمكان إرسال Telegram مستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` مسار العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقاً مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدار التمهيدي/المستقر المنشور.
- يحزم `source=ref` فرعاً أو وسماً أو SHA commit كاملاً موثوقاً في `package_ref`. يجلب محلل الحزمة فروع/وسوم OpenClaw، ويتحقق من أن الـ commit المحدد قابل للوصول من تاريخ فروع المستودع أو وسم إصدار، ويثبت التبعيات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` أرشيف HTTPS بصيغة `.tgz`؛ ويكون `package_sha256` مطلوباً.
- ينزّل `source=artifact` أرشيف `.tgz` واحداً من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختيارياً لكن ينبغي توفيره للقطع الأثرية المشتركة خارجياً.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود مسار العمل/الحزام الموثوق الذي يشغّل الاختبار. `package_ref` هو commit المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لحزام الاختبار الحالي التحقق من commits مصدر موثوقة أقدم دون تشغيل منطق مسارات عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية Plugin دون اتصال بحيث لا يعتمد تحقق الحزمة المنشورة على إتاحة ClawHub live. يعيد مسار Telegram الاختياري استخدام قطعة `package-under-test` الأثرية في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

لسياسة اختبار التحديثات والـ Plugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات والـ Plugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وقطعة حزمة الإصدار المحضرة، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=all-since-2026.4.23`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. هذا يُبقي إثبات ترحيل الحزمة، والتحديث، وتنظيف تبعيات الـ Plugin القديمة، وإصلاح تثبيت الـ Plugin المكوّن، والـ Plugin دون اتصال، وتحديث الـ Plugin، وTelegram على أرشيف الحزمة المحلول نفسه. عيّن `package_acceptance_package_spec` في Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلاً من القطعة الأثرية المبنية من SHA. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد في كل تشغيل. في قبول الحزمة، يكون أرشيف `package-under-test` المحلول هو المرشح دائماً، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور البديل، ويكون افتراضياً `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسارات الفاشلة على ذلك الخط الأساسي. عيّن `published_upgrade_survivor_baselines=all-since-2026.4.23` لتوسيع CI الكامل للإصدار عبر كل إصدار npm مستقر من `2026.4.23` حتى `latest`؛ ويبقى `release-history` متاحاً لأخذ عينات يدوية أوسع باستخدام نقطة الارتساء الأقدم السابقة للتاريخ. عيّن `published_upgrade_survivor_scenarios=reported-issues` لتوسيع الخطوط الأساسية نفسها عبر تجهيزات على شكل مسائل لإعداد Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المكوّنة، ومسارات سجل tilde، وجذور تبعيات Plugin قديمة راكدة. يستخدم مسار العمل المنفصل `Update Migration` مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف التحديثات المنشورة بشكل شامل، وليس اتساع CI الكامل العادي للإصدار. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يكوّن المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مضمّنة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` بالإضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الطازجة للحزمة والمثبّت أيضاً من أن حزمة مثبتة يمكنها استيراد تجاوز التحكم في المتصفح من مسار Windows مطلق خام. يعتمد اختبار smoke لدورة وكيل OpenAI عبر أنظمة التشغيل افتراضياً على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون معيناً، وإلا يستخدم `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x.

### نوافذ التوافق القديم

لدى قبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة مسبقاً. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من الأرشيف؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيماً مفقودة من `pnpm.patchedDependencies` من تجهيز git الزائف المشتق من الأرشيف وقد يسجل `update.channel` مستمراً مفقوداً؛
- قد تقرأ اختبارات smoke الخاصة بالـ Plugin مواقع سجل تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضاً من ملفات ختم بيانات تعريف البناء المحلية التي كانت قد شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلاً من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## فحص التثبيت السريع

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يقسم تغطية الفحص السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تلمس أسطح Docker/الحزمة، أو تغييرات حزمة/ملف بيان Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تختبرها مهام فحص Docker السريعة. تغييرات Plugin المضمّن الخاصة بالمصدر فقط، والتعديلات الخاصة بالاختبارات فقط، والتعديلات الخاصة بالوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغّل فحص CLI السريع لحذف الوكلاء لمساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء extension مضمّنة، ويشغّل ملف تعريف Docker المحدود لـ bundled-plugin ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع حد منفصل لكل تشغيل Docker في كل سيناريو).
- **المسار الكامل** يحتفظ بتغطية تثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلاً أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يحضّر install-smoke أو يعيد استخدام صورة فحص Dockerfile جذرية واحدة من GHCR لهدف SHA، ثم يشغّل تثبيت حزمة QR، وفحوصات Dockerfile/Gateway الجذرية، وفحوصات المثبّت/التحديث، وDocker E2E السريع لـ bundled-plugin كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف فحوصات الصورة الجذرية.

دفعات `main` (بما فيها commits الدمج) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند الدفع، يحتفظ سير العمل بفحص Docker السريع ويترك فحص التثبيت الكامل للتشغيل الليلي أو تحقق الإصدار.

يخضع فحص موفّر صورة تثبيت Bun العالمي البطيء لحاجز منفصل عبر `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `Install Smoke` اليدوية اختيار تفعيله، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار مباشر مشتركة واحدة مسبقاً، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبّت حزمة tarball نفسها في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ومنطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات التجمع الرئيسي للمسارات العادية.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات تجمع الذيل الحساس للموفّر.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات المباشرة المتزامنة حتى لا يفرض الموفّرون قيوداً.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | حد مسارات تثبيت npm المتزامنة.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد مسارات الخدمات المتعددة المتزامنة.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | التدرج بين بدء المسارات لتجنب عواصف إنشاء عفريت Docker؛ اضبطه على `0` لعدم استخدام التدرج.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات live/tail المحددة حدوداً أضيق.             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط | قائمة مسارات دقيقة مفصولة بفواصل؛ تتجاوز فحص التنظيف السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعلي أن يبدأ من تجمع فارغ، ثم يعمل وحده إلى أن يحرر السعة. تتحقق عمليات الفحص المسبق المحلية الإجمالية من Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات لترتيب الأطول أولاً، وتتوقف افتراضياً عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل live/E2E قابل لإعادة الاستخدام

يسأل سير عمل live/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، وصورة live، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر حزمة من التشغيل الحالي، أو ينزّل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور Docker E2E المجردة/الوظيفية في GHCR الموسومة بملخص الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات مثبّتة بالحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلاً من إعادة البناء. تتم إعادة محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة، حتى يعاد سريعاً تدفق سجل/ذاكرة تخزين مؤقت عالق بدلاً من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار عبر مهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى لا يسحب كل جزء إلا نوع الصورة الذي يحتاجه وينفّذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يبقى الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي اليدوي لإعادة التشغيل لكلا مساري مثبّت الموفّر.

يُضم OpenWebUI إلى `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكامل ذلك، ويحتفظ بجزء مستقل `openwebui` فقط لتشغيلات OpenWebUI-only. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند فشل شبكة npm العابر.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وملف JSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل سير العمل `docker_lanes` المسارات المحددة مقابل الصور المحضّرة بدلاً من مهام الأجزاء، ما يبقي تصحيح المسار الفاشل محدوداً في مهمة Docker واحدة موجهة ويحضّر أثر الحزمة أو ينزّله أو يعيد استخدامه لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker مباشراً، تبني المهمة الموجهة صورة الاختبار المباشر محلياً لإعادة التشغيل تلك. تتضمن أوامر إعادة تشغيل GitHub المولدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضّرة عندما تكون هذه القيم موجودة، حتى يتمكن المسار الفاشل من إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يومياً.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك هو سير عمل منفصل يشغّله `Full Release Validation` أو مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وتشغيلات CI اليدوية المستقلة هذه المجموعة معطلة. يوازن اختبارات Plugin المضمّن عبر ثمانية عمال extension؛ تعمل مهام أجزاء extension هذه على ما يصل إلى مجموعتي إعداد Plugin في كل مرة مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker التمهيدي الخاص بالإصدار فقط مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها من دقيقة إلى ثلاث دقائق.

## مختبر QA

لدى مختبر QA مسارات CI مخصصة خارج سير العمل الذكي ذي النطاق الرئيسي. التكافؤ الوكيلي متداخل ضمن حزم QA والإصدار الواسعة، وليس سير عمل PR مستقلاً. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يصاحب التكافؤ تشغيل تحقق واسعاً.

- يشغّل سير عمل `QA-Lab - All Lanes` ليلياً على `main` وعند التشغيل اليدوي؛ ويفرّع مسار التكافؤ الوهمي، ومسار Matrix المباشر، ومساري Telegram وDiscord المباشرين كمهام متوازية. تستخدم المهام المباشرة بيئة `qa-live-shared`، ويستخدم Telegram/Discord إيجارات Convex.

تشغّل فحوصات الإصدار مسارات النقل المباشر لـ Matrix وTelegram مع الموفّر الوهمي الحتمي والنماذج المؤهلة للوهم (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يكون عقد القناة معزولاً عن كمون النموذج المباشر وبدء Plugin الموفّر العادي. يعطل Gateway النقل المباشر بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال الموفّر مجموعات النموذج المباشر، والموفّر الأصلي، وموفّر Docker المنفصلة.

تستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI المستخرج. يبقى الافتراضي في CLI ومدخل سير العمل اليدوي `all`؛ وتشغيل `matrix_profile=all` اليدوي يقسم دائماً تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضاً مسارات مختبر QA الحرجة للإصدار قبل موافقة الإصدار؛ تشغّل بوابة تكافؤ QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين إلى مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة إلى طلبات السحب العادية، اتبع أدلة CI/الفحوصات المحددة النطاق بدلاً من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو ماسح أمان أولي ضيق عمدًا، وليس فحصًا كاملًا للمستودع. تفحص عمليات التشغيل اليومية واليدوية وعمليات حراسة طلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرًا باستخدام استعلامات أمان عالية الثقة مفلترة إلى `security-severity` العالية/الحرجة.

تبقى حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط الأساس للمصادقة والأسرار وsandbox وCron وGateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القناة وGateway وPlugin SDK والأسرار ونقاط تماس التدقيق                  |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF الأساسية وتحليل IP وحارس الشبكة وجلب الويب وSSRF في Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP ومساعدات تنفيذ العمليات والتسليم الصادر وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin والمحمّل والبيان والسجل وتثبيت مدير الحزم وتحميل المصدر وعقد حزمة Plugin SDK                           |

### شظايا الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — شظية أمان Android المجدولة. تبني تطبيق Android يدويًا من أجل CodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة سير العمل. تُحمّل النتائج ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا من أجل CodeQL على Blacksmith macOS، وتفلتر نتائج بناء التبعيات خارج SARIF المحمّل، وتحمّلها ضمن `/codeql-critical-security/macos`. تُبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المطابقة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية وبدرجة خطورة خطأ، على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة بها أصغر عمدًا من الملف المجدول: طلبات السحب غير المسودة لا تشغل إلا الشظايا المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، أو كود مخطط/ترحيل/IO الإعدادات، أو كود المصادقة/الأسرار/sandbox/الأمان، أو وقت تشغيل القناة الأساسية وPlugin القناة المضمّن، أو بروتوكول/طريقة خادم Gateway، أو وقت تشغيل الذاكرة/ربط SDK، أو MCP/العمليات/التسليم الصادر، أو وقت تشغيل المزوّد/كتالوج النماذج، أو تشخيص الجلسات/طوابير التسليم، أو محمّل Plugin، أو Plugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغل كل شظايا جودة طلبات السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي نقاط تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وsandbox وCron وGateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات والترحيل والتطبيع وIO                                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرائق الخادم                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّن                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت التشغيل لتنفيذ الأوامر وإرسال النماذج/المزوّدين وإرسال الرد التلقائي والطوابير ومستوى التحكم ACP                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات ومساعدات مراقبة العمليات وعقود التسليم الصادر                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK وواجهات وقت تشغيل الذاكرة المستعارة وأسماء الذاكرة المستعارة في Plugin SDK وربط تفعيل وقت تشغيل الذاكرة وأوامر طبيب الذاكرة                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد وطوابير تسليم الجلسات ومساعدات ربط/تسليم الجلسات الصادرة وأسطح حزمة أحداث/سجلات التشخيص وعقود CLI لطبيب الجلسات                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة/تقطيع/وقت تشغيل الرد، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/الخيط                      |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وإعدادات/كتالوجات المزوّد الافتراضية، وسجلات الويب/البحث/الجلب/التضمين          |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد Control UI، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وIO الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                               |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول Plugin SDK                                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                              |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسيع CodeQL الخاص بـ Swift وPython والـPlugin المضمّنة كعمل لاحق محدود النطاق أو مجزأ فقط بعد أن تستقر الملفات الضيقة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء الوثائق الحالية متوافقة مع التغييرات التي هبطت مؤخرًا. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح بدفعة غير بوت على `main` أن يفعّله، ويمكن للتشغيل اليدوي أن يشغله مباشرة. تتخطى استدعاءات workflow-run عندما يكون `main` قد تقدم أو عندما أُنشئ تشغيل آخر غير متخطى لـ Docs Agent خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA مصدر Docs Agent السابق غير المتخطى إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على الوثائق.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولة صرفة: يمكن لتشغيل CI ناجح بدفعة غير بوت على `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد شُغّل أو ما زال يعمل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعًا لكامل الحزمة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبار صغيرة فقط مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير كامل الحزمة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان في خط الأساس اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير كامل الحزمة بعد الوكيل قبل أن يُلتزم أي شيء. عندما يتقدم `main` قبل وصول دفعة البوت، يعيد المسار تطبيق الرقعة المتحقق منها فوق القاعدة الجديدة، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ وتُتخطى الرقع القديمة المتعارضة. يستخدم GitHub-hosted Ubuntu حتى يستطيع إجراء Codex الحفاظ على وضعية السلامة نفسها بدون sudo مثل وكيل الوثائق.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يضبط الوضع الافتراضي على dry-run ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدموج وأن كل تكرار لديه إما قضية مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية والتوجيه حسب التغيير

تعيش منطقية مسارات التغيير المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من النطاق الواسع لمنصة CI:

- تغييرات الإنتاج الأساسية تشغل فحص أنواع إنتاج core وفحص أنواع اختبارات core إضافة إلى lint/guards الخاصة بـ core؛
- تغييرات اختبارات core فقط تشغل فقط فحص أنواع اختبارات core إضافة إلى lint الخاصة بـ core؛
- تغييرات إنتاج extension تشغل فحص أنواع إنتاج extension وفحص أنواع اختبارات extension إضافة إلى lint الخاصة بـ extension؛
- تغييرات اختبارات extension فقط تشغل فحص أنواع اختبارات extension إضافة إلى lint الخاصة بـ extension؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع extension لأن الامتدادات تعتمد على تلك العقود الأساسية (تبقى فحوصات Vitest للامتدادات عمل اختبار صريحًا)؛
- رفعات الإصدارات الخاصة ببيانات الإصدار فقط تشغل فحوصات موجهة للإصدار/الإعدادات/تبعيات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم الاختبارات الشقيقة والمعتمدين عبر رسم الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد الخرائط الصريحة: التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجّه موجه النظام لأداة الرسائل تمر عبر اختبارات رد core إضافة إلى انحدارات تسليم Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا بما يكفي في البنية الاختبارية بحيث لا تكون المجموعة الرخيصة المرسومة وكيلًا موثوقًا.

## تحقق Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا مُحمّى حديثًا للإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يُظهر `git status --short` ما لا يقل عن 200 حذف متتبّع. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وجهّز صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذاك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محلي يبقى في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو مسار الصندوق البعيد الثاني المملوك للمستودع لإثبات Linux عندما لا يكون Blacksmith متاحًا أو عندما تكون السعة السحابية المملوكة مفضلة. جهّز صندوقًا، وعبّئه عبر سير عمل المشروع، ثم شغّل الأوامر عبر Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

تملك `.crabbox.yaml` الإعدادات الافتراضية للمزوّد والمزامنة والتعبئة في GitHub Actions. وهي تستبعد `.git` المحلي بحيث يحتفظ إيداع Actions المُعبّأ ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة مستودعات بعيدة ومخازن كائنات محلية لدى المشرف، كما تستبعد آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يملك `.github/workflows/crabbox-hydrate.yml` الإيداع، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية الذي تستند إليه أوامر `crabbox run --id <cbx_id>` لاحقًا.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

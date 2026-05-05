---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تعمل على استكشاف أخطاء فحص GitHub Actions فاشل وإصلاحها
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-05T01:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

تعمل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتعطّل المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز تشغيلات `workflow_dispatch` اليدوية النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                          | الغرض                                                                                                    | متى تعمل                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | كشف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                          | دائمًا عند الدفعات وطلبات السحب غير المسودات |
| `security-scm-fast`              | كشف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                       | دائمًا عند الدفعات وطلبات السحب غير المسودات |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج من دون اعتماديات مقابل تحذيرات npm                                                | دائمًا عند الدفعات وطلبات السحب غير المسودات |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                                         | دائمًا عند الدفعات وطلبات السحب غير المسودات |
| `check-dependencies`             | تمرير إنتاجي من Knip للاعتماديات فقط مع حارس قائمة السماح للملفات غير المستخدمة                         | تغييرات ذات صلة بـ Node            |
| `build-artifacts`                | بناء `dist/` وواجهة Control UI، وفحوصات المخرجات المبنية، ومخرجات قابلة لإعادة الاستخدام downstream     | تغييرات ذات صلة بـ Node            |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات الحزم/عقد Plugin/البروتوكول                                         | تغييرات ذات صلة بـ Node            |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المجزأة مع نتيجة فحص تجميعية مستقرة                                                 | تغييرات ذات صلة بـ Node            |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والحزم والعقود والإضافات                          | تغييرات ذات صلة بـ Node            |
| `check`                          | مكافئ البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج، والتدقيق، والحراس، وأنواع الاختبارات، وفحص صارم سريع | تغييرات ذات صلة بـ Node            |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المجزأ، وحراس الإضافات، وحدود الحزمة، ومراقبة Gateway                  | تغييرات ذات صلة بـ Node            |
| `build-smoke`                    | اختبارات سريعة لـ CLI المبني وفحص سريع لذاكرة بدء التشغيل                                               | تغييرات ذات صلة بـ Node            |
| `checks`                         | متحقق لاختبارات قناة المخرجات المبنية                                                                    | تغييرات ذات صلة بـ Node            |
| `checks-node-compat-node22`      | مسار بناء وفحص سريع لتوافق Node 22                                                                       | تشغيل CI يدوي للإصدارات            |
| `check-docs`                     | تنسيق التوثيق وتدقيقه وفحوصات الروابط المعطلة                                                           | تغيّر التوثيق                      |
| `skills-python`                  | Ruff + pytest لـ Skills المدعومة بـ Python                                                              | تغييرات ذات صلة بـ Skills الخاصة بـ Python |
| `checks-windows`                 | اختبارات عمليات/مسارات خاصة بـ Windows مع انحدارات محددات استيراد وقت التشغيل المشتركة                 | تغييرات ذات صلة بـ Windows         |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام المخرجات المبنية المشتركة                                     | تغييرات ذات صلة بـ macOS           |
| `macos-swift`                    | تدقيق Swift وبناؤه واختباراته لتطبيق macOS                                                              | تغييرات ذات صلة بـ macOS           |
| `android`                        | اختبارات وحدة Android لكلا النكهتين مع بناء APK تصحيحي واحد                                             | تغييرات ذات صلة بـ Android         |
| `test-performance-agent`         | تحسين يومي للاختبارات البطيئة في Codex بعد نشاط موثوق                                                   | نجاح CI الرئيسي أو تشغيل يدوي      |
| `openclaw-performance`           | تقارير أداء وقت تشغيل Kova يومية/عند الطلب مع مسارات موفر وهمي، وملف عميق، وGPT 5.4 مباشر              | تشغيل مجدول ويدوي                  |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليست مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام مصفوفة المخرجات والمنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة بحيث يستطيع المستهلكون downstream البدء فور جاهزية البناء المشترك.
4. تتفرع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزتها دفعة أحدث على طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` بحيث تظل تبلغ عن إخفاقات الأجزاء العادية لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تم تجاوزه بالفعل. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) بحيث لا يستطيع شبح عالق من جهة GitHub في مجموعة طابور قديمة حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم التشغيلات اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي التشغيلات قيد التنفيذ.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي كشف changed-scope ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيّرت.

- **تعديلات سير عمل CI** تتحقق من رسم Node CI مع تدقيق سير العمل، لكنها لا تفرض وحدها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات تلك المنصات محددة النطاق لتغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات محددة ورخيصة على تركيبات اختبارات core، وتعديلات ضيقة على مساعد/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريعًا خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار مخرجات البناء، وتوافق Node 22، وعقود القنوات، وأجزاء core الكاملة، وأجزاء Plugin المجمعة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدة التي تمرنها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة النطاق لمغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغلات npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير ذات الصلة، وPlugin، وفحص التثبيت السريع، والتغييرات الخاصة بالاختبارات فقط على مسارات Linux Node.

تُقسّم عائلات اختبارات Node الأبطأ أو توازن بحيث تبقى كل مهمة صغيرة من دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتعمل مسارات core unit fast/support بشكل منفصل، وتُقسّم بنية وقت تشغيل core بين أجزاء الحالة والعملية/الإعدادات، ويعمل auto-reply كعمال متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُقسّم إعدادات agentic gateway/server عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلًا من انتظار المخرجات المبنية. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلًا من ملتقط Plugin المشترك. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يستطيع `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل من جزء مرشح. يحافظ `check-additional` على أعمال ترجمة/Canary حدود الحزم معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُوزّع قائمة حارس الحدود عبر أربعة أجزاء مصفوفة، يشغّل كل منها حراسًا مستقلين محددين بالتوازي ويطبع توقيتات لكل فحص، بما في ذلك `pnpm prompt:snapshots:check` بحيث يُثبت انحراف مطالبة المسار السعيد لوقت تشغيل Codex على طلب السحب الذي تسبب فيه. تعمل مراقبة Gateway واختبارات القنوات وجزء حدود دعم core بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ لا يزال مسار اختبار الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف debug APK مكررة في كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير إنتاجي من Knip للاعتماديات فقط مثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبار المباشر وجسر الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب كود طلبات السحب غير الموثوق أو ينفذه. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام عند الدفعات إلى `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية مطبعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام ملاحظة، وليس تسليمًا افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته ويجب أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للتنفيذ أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مُدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## التشغيلات اليدوية

تُشغِّل عمليات تشغيل CI اليدوية مخطط المهام نفسه مثل CI العادي، لكنها تفرض تشغيل كل مسار محدود النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات التوثيق، وPython skills، وWindows، وmacOS، وتدويل Control UI. تُشغِّل عمليات تشغيل CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android عبر تمرير `include_android=true`. تُستثنى من CI فحوصات Plugin التمهيدية الثابتة، وجزء `agentic-plugins` الخاص بالإصدار فقط، والفحص الدفعي الكامل للإضافات، ومسارات Docker التمهيدية لـ Plugin. لا تعمل حزمة Docker التمهيدية إلا عندما تُشغِّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة تحقق الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى حزمة مرشح الإصدار الكاملة بسبب تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط على فرع أو وسم أو SHA كامل لالتزام، مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمّنة السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء `check-additional` وتجميعاتها، ومحققات تجميع اختبارات Node، وفحوصات التوثيق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضًا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الإضافات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبار Linux Node، وأجزاء اختبار Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي لوحدة المعالجة المركزية بحيث كلّفت 8 vCPU أكثر مما وفّرت)؛ وبناءات Docker لـ install-smoke (كلّف وقت اصطفاف 32-vCPU أكثر مما وفّر)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود الفروع المتشعبة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود الفروع المتشعبة إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

يقيس التشغيل اليدوي عادةً مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرَس مسارات التقارير المنشورة ومؤشرات الأحدث حسب المرجع المختبَر، ويسجل كل `index.md` مرجع/SHA المختبَر، ومرجع/SHA سير العمل، ومرجع Kova، والملف الشخصي، ووضع مصادقة المسار، والنموذج، وعدد التكرار، ومرشحات السيناريو.

يثبّت سير العمل OCM من إصدار مثبّت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية ضد وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل أداء CPU/heap/trace لنقاط السخونة في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI حقيقية `openai/gpt-5.4`، يتم تخطيها عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا مجسات مصدر OpenClaw الأصلية بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات ترحيب متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء CLI ضد Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` داخل حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار عناصر GitHub. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يلتزم سير العمل أيضًا بـ `report.json`، و`report.md`، والحزم، و`index.md`، وعناصر مجس المصدر إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبَر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لعبارة "شغّل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا لالتزام، ويشغّل سير عمل `CI` اليدوي مع ذلك الهدف، ويشغّل `Plugin Prerelease` لإثبات Plugin/الحزمة/الثابت/Docker الخاص بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تُبقي عمليات التشغيل المستقرة/الافتراضية تغطية live/E2E الشاملة ومسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل تغطية النقع هذه بحيث يظل التحقق الاستشاري الواسع واسعًا. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` ضد عنصر `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه ضد حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، وفروق الملفات الشخصية، والعناصر، و
مقابض إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُحدث تغييرات. شغّله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويشغّل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويشغّل
`Plugin ClawHub Release` لـ SHA الإصدار نفسه، وبعد ذلك فقط يشغّل
`OpenClaw NPM Release` مع `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبّت على فرع سريع الحركة، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع تشغيل سير عمل GitHub فروعًا أو وسومًا، لا SHA خامًا لالتزام. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويشغّل `Full Release Validation` من ذلك المرجع المثبّت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عند
اكتمال التشغيل. يفشل محقق المظلة أيضًا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في نطاق مزوّدي الخدمة/الاختبارات الحية الممرّر إلى فحوصات الإصدار. تستخدم
سير عمل الإصدار اليدوية القيمة الافتراضية `stable`؛ استخدم `full` فقط عندما
تريد عن قصد مصفوفة مزوّدي الخدمة/الوسائط الاستشارية الواسعة. يتحكم `run_release_soak`
في ما إذا كانت فحوصات الإصدار المستقرة/الافتراضية تشغّل اختبار التحمل الشامل لمسار الإصدار
للاختبارات الحية/E2E وDocker؛ تفرض `full` تشغيل اختبار التحمل.

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- تضيف `stable` مجموعة مزوّدي الخدمة/الخلفيات المستقرة.
- تشغّل `full` مصفوفة مزوّدي الخدمة/الوسائط الاستشارية الواسعة.

يسجّل المسار الجامع معرّفات تشغيل الأبناء التي تم إرسالها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وتحول إلى أخضر، فأعد تشغيل مهمة التحقق الأبوية فقط لتحديث نتيجة المسار الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للابن العادي لفحص CI الكامل فقط، و`plugin-prerelease` لابن ما قبل إصدار Plugin فقط، و`release-checks` لكل أبناء الإصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المسار الجامع. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركّز. لمسار cross-OS واحد فاشل، اجمع `rerun_group=cross-os` مع `cross_os_suite_filter`، مثل `windows/packaged-upgrade`؛ تصدر أوامر cross-OS الطويلة أسطر Heartbeat، وتتضمن ملخصات packaged-upgrade توقيتات لكل مرحلة. مسارات QA الخاصة بفحوصات الإصدار استشارية، لذلك تحذّر إخفاقات QA فقط لكنها لا تمنع متحقق فحوصات الإصدار.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى حزمة tarball باسم `release-package-under-test`، ثم تمرّر ذلك الأثر إلى فحوصات cross-OS و"قبول الحزمة"، إضافة إلى سير عمل Docker الحي/E2E لمسار الإصدار عندما تعمل تغطية التحمل. هذا يبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة تحزيم المرشح نفسه في عدة مهام أبناء.

تشغيلات `Full Release Validation` المكررة لـ`ref=main` و`rerun_group=all`
تستبدل المسار الجامع الأقدم. يلغي مراقب الأصل أي سير عمل ابن
أرسله بالفعل عند إلغاء الأصل، لذلك لا يبقى تحقق main الأحدث
خلف تشغيل فحص إصدار قديم مدته ساعتان. يحافظ تحقق فروع/وسوم الإصدار
ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## شظايا الاختبارات الحية وE2E

يحافظ ابن الإصدار الحي/E2E على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المفلترة حسب مزوّد الخدمة
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شظايا صوت/فيديو وسائط مقسمة وشظايا موسيقى مفلترة حسب مزوّد الخدمة

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص إخفاقات مزوّدي الخدمة الحية البطيئة. تظل أسماء الشظايا التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادة التشغيل اليدوية لمرة واحدة.

تعمل شظايا الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبّت هذه الصورة `ffmpeg` و`ffprobe` مسبقا؛ وتتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق أجنحة الاختبار الحية المدعومة بـDocker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان الصحيح لإطلاق اختبارات Docker متداخلة.

تستخدم شظايا النماذج/الخلفيات الحية المدعومة بـDocker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker الحي، وGateway المقسم حسب مزوّد الخدمة، وخلفية CLI، وربط ACP، وحاضنة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شظايا Docker الخاصة بـGateway حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل، بحيث تفشل الحاوية العالقة أو مسار التنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الشظايا بناء هدف Docker الكامل من المصدر بشكل مستقل، فإن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقتا فعليا على بناء صور مكررة.

## قبول الحزمة

استخدم "قبول الحزمة" عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" فهو مختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حاضنة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يتحقق `resolve_package` من `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفعهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف التعريفي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويحضّر صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلا من تحزيم نسخة سير العمل المسحوبة. عندما يحدد ملف تعريفي عدة `docker_lanes` موجهة، يحضّر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker موجهة ومتوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحدا؛ ولا يزال بإمكان إرسال Telegram المستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشح

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول إصدارات ما قبل الإصدار/المستقرة المنشورة.
- يحزم `source=ref` فرعا أو وسمًا أو SHA التزاما كاملا موثوقا في `package_ref`. يجلب المحلّل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من تاريخ فروع المستودع أو وسم إصدار، ويثبّت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عبر HTTPS؛ ويكون `package_sha256` مطلوبا.
- ينزّل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ ويكون `package_sha256` اختياريا لكن ينبغي تقديمه للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحاضنة الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يتم تحزيمه عندما يكون `source=ref`. يتيح هذا لحاضنة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الجناح

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — قيم `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف `package` التعريفي تغطية Plugin دون اتصال حتى لا يكون تحقق الحزمة المنشورة مرهونا بتوفر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

لسياسة التحديث واختبار Plugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضيات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`telegram_mode=mock-openai`. هذا يبقي إثبات ترحيل الحزمة، والتحديث، وتنظيف اعتماديات Plugin القديمة، وإصلاح تثبيت Plugin المهيأ، وPlugin دون اتصال، وتحديث Plugin، وTelegram على tarball الحزمة المحلولة نفسه. عيّن `package_acceptance_package_spec` في Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلا من الأثر المبني من SHA. لا تزال فحوصات إصدار cross-OS تغطي سلوك الإعداد الأولي، والمثبّت، والمنصة الخاص بنظام التشغيل؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس حزمة منشورة واحد لكل تشغيل في مسار الإصدار الحاجز. في قبول الحزمة، يكون tarball `package-under-test` المحلول هو المرشح دائما، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع الافتراضي `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسارات الفاشلة على ذلك الخط الأساسي. يعيّن Full Release Validation مع `run_release_soak=true` أو `release_profile=full` القيمتين `published_upgrade_survivor_baselines=all-since-2026.4.23` و`published_upgrade_survivor_scenarios=reported-issues` للتوسع عبر كل إصدارات npm المستقرة من `2026.4.23` حتى `latest` وتركيبات على هيئة مشكلات لإعداد Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المهيأة، ومسارات سجلات tilde، وجذور اعتماديات Plugin القديمة الراكدة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال عن تنظيف تحديثات منشورة شامل، وليس نطاق Full Release CI العادي. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يهيئ المسار المنشور خط الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz`، إضافة إلى حالة RPC بعد بدء Gateway. تتحقق أيضا مسارات Windows المحزمة والمثبت الجديد من أن الحزمة المثبتة تستطيع استيراد تجاوز browser-control من مسار Windows مطلق خام. تستخدم تجربة دخان دورة وكيل OpenAI عبر cross-OS القيمة الافتراضية `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينها، وإلا `openai/gpt-5.4`، لذلك يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

لقبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة بالفعل. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA خاصة معروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرار `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من تركيبة git الوهمية المشتقة من tarball وقد يسجل فقدان `update.channel` المستمر؛
- قد تقرأ اختبارات دخان Plugin مواقع سجلات تثبيت قديمة أو تقبل فقدان استمرار سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات التعريف في الإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات ختم بيانات تعريف البناء المحلي التي شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ فالشروط نفسها تفشل بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص تشغيل `docker_acceptance` الفرعي وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker المحددة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار الدخان للتثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. ويقسّم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمرّنها مهام دخان Docker. تغييرات Plugin المضمّن المصدرية فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويفحص CLI، ويشغّل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل اختبار gateway-network e2e للحاوية، ويتحقق من وسيط بناء لإضافة مضمّنة، ويشغّل ملف تعريف Docker محدودًا للـ Plugin المضمّن ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- **المسار الكامل** يحتفظ بتثبيت حزمة QR وتغطية Docker/التحديث الخاصة بالمثبّت لتشغيلات الجدولة الليلية، وعمليات الإرسال اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة دخان GHCR الجذرية من Dockerfile لهدف target-SHA واحد، ثم يشغّل تثبيت حزمة QR، ودخان Dockerfile/Gateway الجذري، ودخان المثبّت/التحديث، وE2E Docker السريع للـ Plugin المضمّن كمهام منفصلة بحيث لا ينتظر عمل المثبّت خلف دخان الصورة الجذرية.

دفعات `main` (بما في ذلك commits الدمج) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يحتفظ سير العمل بدخان Docker السريع ويترك دخان التثبيت الكامل للجدولة الليلية أو تحقق الإصدار.

دخان Bun البطيء لتثبيت الصورة المزوّدة عالميًا مضبوط بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل في الجدولة الليلية ومن سير عمل فحوصات الإصدار، ويمكن لعمليات الإرسال اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfiles المركّزة على التثبيت الخاصة بها.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقًا صورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git عارٍ لمسارات المثبّت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبّت نفس tarball في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات مع `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزوّد.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة كي لا يفرض المزوّدون خنقًا.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تباعد بين بدايات المسارات لتجنب عواصف إنشاء عفريت Docker؛ اضبط `0` لعدم وجود تباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيل محددة حدودًا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى دخان التنظيف كي يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعّال أن يبدأ من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تتحقق التمهيدات الإجمالية المحلية من Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولًا، وتتوقف افتراضيًا عن جدولة مسارات مجمّعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة، ونوع الصورة، والصورة الحية، والمسار، وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. فهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر حزمة من التشغيل الحالي، أو ينزّل أثر حزمة من `package_artifact_run_id`؛ يتحقق من مخزون tarball؛ يبني ويدفع صور Docker E2E عارية/وظيفية موسومة بملخص الحزمة إلى GHCR عبر ذاكرة طبقات Docker المؤقتة من Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. يُعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة، بحيث تعاد محاولة تدفق سجل/ذاكرة مؤقتة عالق بسرعة بدلًا من استهلاك معظم المسار الحرج في CI.

### مقاطع مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مقطعة أصغر مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل مقطع نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر نفس المجدول الموزون:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

مقاطع Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار للمسار `install-e2e` الاسم المستعار اليدوي التجميعي لإعادة التشغيل لكلا مساري مثبّت المزوّدين.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بمقطع مستقل `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القناة المضمّنة المحاولة مرة واحدة عند فشل شبكة npm عابر.

يرفع كل مقطع `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وخطة المجدول بصيغة JSON، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل إدخال `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المجهّزة بدلًا من مهام المقاطع، مما يبقي تصحيح المسار الفاشل محصورًا في مهمة Docker مستهدفة واحدة ويحضّر أثر الحزمة لذلك التشغيل أو ينزّله أو يعيد استخدامه؛ إذا كان المسار المحدد مسار Docker حيًا، تبني المهمة المستهدفة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل عبر GitHub المولّدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المجهّزة عندما تكون هذه القيم موجودة، بحيث يستطيع المسار الفاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## Plugin ما قبل الإصدار

`Plugin Prerelease` هي تغطية منتج/حزمة أعلى تكلفة، لذلك هي سير عمل منفصل يرسله `Full Release Validation` أو مشغّل صريح. طلبات السحب العادية، ودفعات `main`، وعمليات إرسال CI اليدوية المستقلة تبقي تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمّن عبر ثمانية عمال إضافات؛ تشغّل مهام شظايا الإضافات هذه ما يصل إلى مجموعتي إعدادات Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر كي لا تنشئ دفعات Plugin كثيرة الاستيراد مهام CI إضافية. يجمع مسار Docker لما قبل الإصدار الخاص بالإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها دقيقة إلى ثلاث دقائق.

## مختبر ضمان الجودة

لدى مختبر ضمان الجودة مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. تكافؤ الوكلاء متداخل تحت أحزمة ضمان الجودة والإصدار الواسعة، وليس سير عمل مستقلًا لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما يجب أن ينتقل التكافؤ مع تشغيل تحقق واسع.

- يشغّل سير عمل `QA-Lab - All Lanes` ليلًا على `main` وعند الإرسال اليدوي؛ وهو يوسّع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود إيجار Convex.

تشغّل فحوصات الإصدار مسارات النقل الحية لـ Matrix وTelegram مع المزوّد الوهمي الحتمي والنماذج المؤهلة بالوهم (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يعزل عقد القناة عن زمن استجابة النموذج الحي وبدء Plugin المزوّد العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن تكافؤ ضمان الجودة يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال المزوّد مجموعات النموذج الحي والمزوّد الأصلي ومزوّد Docker المنفصلة.

تستخدم Matrix `--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعمها CLI المسحوب. يظل افتراضي CLI ومدخل سير العمل اليدوي `all`؛ إرسال `matrix_profile=all` اليدوي يقسم دائمًا تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات مختبر ضمان الجودة الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ ضمان الجودة الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحص ذات النطاق بدلًا من معاملة التكافؤ كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو ماسح أمان ضيق للمرور الأول عمدا، وليس مسحا كاملا للمستودع. تفحص تشغيلات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرا، باستخدام استعلامات أمان عالية الثقة مصفاة إلى `security-severity` عالية/حرجة.

يبقى حارس طلب السحب خفيفا: يبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغل مصفوفة الأمان عالية الثقة نفسها التي يشغلها سير العمل المجدول. يبقى CodeQL الخاص بكل من Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وصندوق العزل، وCron، وخط الأساس لـ Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                 |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF في النواة، وتحليل IP، وحارس الشبكة، وجلب الويب، وPlugin SDK                                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدو تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                        |

### شرائح الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — شريحة أمان Android مجدولة. تبني تطبيق Android يدويا لأجل CodeQL على أصغر مشغل Blacksmith Linux يقبله فحص سلامة سير العمل. ترفع النتائج ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شريحة أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا لأجل CodeQL على Blacksmith macOS، وتصفي نتائج بناء التبعيات من SARIF المرفوع، وترفع النتائج ضمن `/codeql-critical-security/macos`. تبقى خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشريحة غير الأمنية المقابلة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغل Blacksmith Linux الأصغر. حارس طلبات السحب الخاص بها أصغر عمدا من الملف المجدول: طلبات السحب غير المسودة تشغل فقط شرائح `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط الإعدادات/الترحيل/IO، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القنوات الأساسية وPlugin القناة المضمن، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/غراء SDK، وتسليم MCP/العمليات/الصادر، ووقت تشغيل المزود/كتالوج النماذج، وتشخيصات الجلسات/طوابير التسليم، ومحمّل Plugin، وعقد Plugin SDK/الحزمة، أو وقت تشغيل رد Plugin SDK. تغييرات إعدادات CodeQL وسير عمل الجودة تشغل كل شرائح جودة طلبات السحب الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي خطافات تعليم/تكرار لتشغيل شريحة جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة، والأسرار، وصندوق العزل، وCron، وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات، والترحيل، والتطبيع، وعقود IO                                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النموذج/المزود، وإرسال الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى التحكم ACP                                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدو الإشراف على العمليات، وعقود التسليم الصادر                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تنشيط وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الرد، وطوابير تسليم الجلسات، ومساعدو ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات                            |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدو حمولة الرد/التقطيع/وقت التشغيل، وخيارات رد القناة، وطوابير التسليم، ومساعدو ربط الجلسة/الخيط                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزود والاكتشاف، وتسجيل وقت تشغيل المزود، وافتراضات/كتالوجات المزود، وسجلات الويب/البحث/الجلب/التضمين                           |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت تشغيل الجلب/البحث الأساسي على الويب، وIO الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                           |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدو عقد حزمة Plugin                                                                                                   |

تبقى الجودة منفصلة عن الأمان لكي يمكن جدولة نتائج الجودة، وقياسها، وتعطيلها، أو توسيعها من دون حجب إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمنة كعمل متابعة محدد النطاق أو مقسم إلى شرائح فقط بعد أن تصبح الملفات الضيقة مستقرة من حيث وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل الوثائق

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء الوثائق الحالية متوافقة مع التغييرات التي هبطت حديثا. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يطلقه، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم أو عندما يكون تشغيل `Docs Agent` آخر غير متخطى قد أُنشئ في الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ `Docs Agent` إلى `main` الحالي، وبذلك يستطيع تشغيل واحد كل ساعة تغطية كل تغييرات main المتراكمة منذ آخر مرور على الوثائق.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح لدفع غير آلي على `main` أن يطلقه، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد شُغل أو كان قيد التشغيل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمعا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبارات صغيرة فقط مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تخفض عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع الروبوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub لكي يستطيع إجراء Codex الحفاظ على وضعية السلامة نفسها لإسقاط sudo مثل وكيل الوثائق.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يكون افتراضيا في وضع التشغيل التجريبي ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط مدمج وأن كل تكرار لديه إما قضية مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` ويتم تنفيذها بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية تلك أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات إنتاج النواة تشغل فحص الأنواع لإنتاج النواة واختبارات النواة إضافة إلى فحص النواة/الحراس؛
- تغييرات اختبارات النواة فقط تشغل فقط فحص أنواع اختبارات النواة إضافة إلى فحص النواة؛
- تغييرات إنتاج الامتدادات تشغل فحص أنواع إنتاج الامتدادات واختبارات الامتدادات إضافة إلى فحص الامتدادات؛
- تغييرات اختبارات الامتدادات فقط تشغل فحص أنواع اختبارات الامتدادات إضافة إلى فحص الامتدادات؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود النواة تلك (تبقى مسوحات امتدادات Vitest عملا اختباريا صريحا)؛
- زيادات الإصدارات الخاصة ببيانات تعريف الإصدار فقط تشغل فحوصات مستهدفة للإصدار/الإعدادات/تبعيات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المتغيرة المحلي في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والمعتمدين في مخطط الاستيراد. إعدادات تسليم غرف المجموعات المشتركة هي إحدى الخرائط الصريحة: التغييرات على إعدادات الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا بما يكفي على مستوى الحزام بحيث لا تكون المجموعة الرخيصة المعينة وكيلا موثوقا.

## تحقق Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا مُهيّأ مسبقًا للإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة سريعًا عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 عملية حذف متتبَّعة. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وهيّئ صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs التي تتضمن عمليات حذف كبيرة مقصودة، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو غلاف الصندوق البعيد المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص أوسع من حلقة تعديل محلية، أو عندما تكون مساواة CI مهمة، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات الحزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. الواجهة الخلفية العادية لـ OpenClaw هي `blacksmith-testbox`؛ وتكون سعة AWS/Hetzner المملوكة بديلًا احتياطيًا عند أعطال Blacksmith، أو مشكلات الحصة، أو الاختبار الصريح للسعة المملوكة.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن عن `blacksmith-testbox`. مرّر المزوّد صراحةً رغم أن `.crabbox.yaml` يحتوي على افتراضيات السحابة المملوكة.

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. يجب أن توقف تشغيلات Crabbox لمرة واحدة والمدعومة من Blacksmith صندوق Testbox تلقائيًا؛ إذا تمت مقاطعة تشغيل أو كان التنظيف غير واضح، فافحص الصناديق الحية وأوقف الصناديق التي أنشأتها فقط:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق المجهّز نفسه:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت طبقة Crabbox هي المعطلة لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرةً كبديل احتياطي ضيق:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

صعّد إلى سعة Crabbox المملوكة فقط عندما يكون Blacksmith متوقفًا، أو محدود الحصة، أو يفتقد البيئة المطلوبة، أو عندما تكون السعة المملوكة هي الهدف صراحةً:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

يمتلك `.crabbox.yaml` افتراضيات المزوّد والمزامنة وتجهيز GitHub Actions لمسارات السحابة المملوكة. يستثني `.git` المحلي كي يحتفظ تسجيل الخروج المجهّز في Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرفين، ويستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يمتلك `.github/workflows/crabbox-hydrate.yml` تسجيل الخروج، وإعداد Node/pnpm، وجلب `origin/main`، وتمرير البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحّح أخطاء فحص GitHub Actions فاشل
    - أنت تنسّق عملية تشغيل أو إعادة تشغيل للتحقق من صحة الإصدار
    - أنت تغيّر إرسال ClawSweeper أو تمرير نشاط GitHub
summary: مخطط مهام التكامل المستمر، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار التكامل المستمر
x-i18n:
    generated_at: "2026-05-04T07:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

يشغّل OpenClaw CI عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الاختلاف وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` تحديد النطاق الذكي عمدا وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تعيش تغطية Plugin الخاصة بالإصدار فقط في سير عمل [`Plugin قبل الإصدار`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`التحقق الكامل من الإصدار`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                              | الغرض                                                                                                   | متى تعمل                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                   | دائما عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                     | دائما عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج دون تبعيات مقابل تنبيهات npm                                          | دائما عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائما عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip للإنتاج الخاص بالتبعيات فقط مع حارس قائمة السماح للملفات غير المستخدمة                                 | تغييرات مرتبطة بـ Node              |
| `build-artifacts`                | بناء `dist/` وواجهة التحكم وفحوصات الأثر المبني والأثر القابل لإعادة الاستخدام للمراحل اللاحقة                       | تغييرات مرتبطة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات الحزم/عقد Plugin/البروتوكول                              | تغييرات مرتبطة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقد القنوات المقسمة مع نتيجة فحص تجميعية مستقرة                                      | تغييرات مرتبطة بـ Node              |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والحزم والعقود والإضافات                          | تغييرات مرتبطة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسم: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، وفحص دخان صارم                | تغييرات مرتبطة بـ Node              |
| `check-additional`               | البنية، وانحراف الحدود/المطالبات المقسم، وحراس الإضافات، وحدود الحزم، ومراقبة Gateway        | تغييرات مرتبطة بـ Node              |
| `build-smoke`                    | اختبارات دخان CLI المبني ودخان ذاكرة بدء التشغيل                                                            | تغييرات مرتبطة بـ Node              |
| `checks`                         | متحقق لاختبارات قنوات الأثر المبني                                                                 | تغييرات مرتبطة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء ودخان توافق Node 22                                                                | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | تنسيق الوثائق، والفحص، وفحوصات الروابط المعطلة                                                             | عند تغيّر الوثائق                       |
| `skills-python`                  | Ruff + pytest لـ Skills المدعومة بـ Python                                                                    | تغييرات مرتبطة بـ Skills في Python      |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows مع انحدارات محددات استيراد وقت التشغيل المشتركة                      | تغييرات مرتبطة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام الآثار المبنية المشتركة                                               | تغييرات مرتبطة بـ macOS             |
| `macos-swift`                    | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                            | تغييرات مرتبطة بـ macOS             |
| `android`                        | اختبارات وحدات Android لكلا النكهتين مع بناء APK تصحيحي واحد                                              | تغييرات مرتبطة بـ Android           |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                 | نجاح CI الرئيسي أو تشغيل يدوي |
| `openclaw-performance`           | تقارير أداء يومية/عند الطلب لوقت تشغيل Kova مع مسارات mock-provider وdeep-profile وGPT 5.4 الحية | تشغيل مجدول ويدوي      |

## ترتيب الفشل السريع

1. تقرر `preflight` أي المسارات موجودة أصلا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام الآثار ومصفوفة المنصات الأثقل.
3. تتداخل `build-artifacts` مع مسارات Linux السريعة حتى يستطيع المستهلكون اللاحقون البدء فور جاهزية البناء المشترك.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تم تجاوزها بوصفها `cancelled` عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` حتى تستمر في الإبلاغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل كله قد تم تجاوزه بالفعل. مفتاح التزامن التلقائي لـ CI موسوم بالإصدار (`CI-v7-*`) حتى لا يستطيع سير عالق من جهة GitHub في مجموعة طابور قديمة حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

## النطاق والتوجيه

يعيش منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان الفحص التمهيدي يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node مع فحص سير العمل، لكنها لا تفرض بحد ذاتها عمليات بناء Windows أو Android أو macOS الأصلية؛ تبقى مسارات المنصات هذه محددة بتغييرات مصدر المنصة.
- **تعديلات التوجيه فقط في CI، وتعديلات fixtures رخيصة محددة لاختبارات النواة، وتعديلات ضيقة لمساعدي/اختبارات توجيه عقد Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight` والأمان ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمن، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محددة بنطاق مغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدي تشغيل npm/pnpm/UI، وإعداد مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير المرتبطة وPlugin ودخان التثبيت والتغييرات الخاصة بالاختبارات فقط على مسارات Linux Node.

تُقسّم عائلات اختبارات Node الأبطأ أو توازن حتى تبقى كل مهمة صغيرة دون حجز مشغلات أكثر من اللازم: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتعمل مسارات النواة السريعة/الداعمة منفصلة، وتقسّم بنية وقت تشغيل النواة بين أجزاء الحالة والعملية/الإعداد، ويعمل الرد التلقائي كعمال متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتقسم إعدادات Gateway/الخادم الوكيلية عبر مسارات chat/auth/model/http-plugin/runtime/startup بدلا من الانتظار على الآثار المبنية. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدلا من مجمّع Plugin المشترك. تسجل أجزاء نمط التضمين إدخالات التوقيت باستخدام اسم جزء CI، حتى يستطيع `.artifacts/vitest-shard-timings.json` تمييز إعداد كامل عن جزء مفلتر. يبقي `check-additional` عمل تجميع/canary حدود الحزم معا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تُخطط قائمة حراس الحدود عبر أربعة أجزاء مصفوفة، يشغل كل منها حراسا مستقلين مختارين بالتزامن ويطبع توقيتات لكل فحص، بما في ذلك `pnpm prompt:snapshots:check` حتى يثبت انحراف مطالبة المسار السعيد لوقت تشغيل Codex إلى طلب السحب الذي سببه. تعمل مراقبة Gateway واختبارات القنوات وجزء حدود دعم النواة بالتزامن داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغل Android CI كلا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK التصحيح الخاص بـ Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانا منفصلين؛ لا يزال مسار اختبارات الوحدة فيها يترجم النكهة مع أعلام SMS/call-log في BuildConfig، مع تجنب مهمة تغليف APK تصحيح مكررة عند كل دفعة مرتبطة بـ Android.

يشغل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip للإنتاج الخاص بالتبعيات فقط، مثبت على أحدث إصدار Knip، مع تعطيل حد أدنى لعمر الإصدار في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج الملفات غير المستخدمة في الإنتاج من Knip مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفا جديدا غير مستخدم وغير مراجع أو يترك إدخالا قديما في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية، والمولدة، والبناء، والاختبار الحي، وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر في جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يجلب شيفرة طلب السحب غير الموثوقة ولا ينفذها. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مضغوطة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` البيانات الوصفية المطَبّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وعنوان URL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدا تمرير جسم Webhook الكامل. سير العمل المستلم في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، الذي ينشر الحدث المطبع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام مراقبة، وليس تسليما افتراضيا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئا أو قابلا للتنفيذ أو محفوفا بالمخاطر أو مفيدا تشغيليا. ينبغي أن تؤدي عمليات الفتح، والتعديلات، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعة العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub، وتعليقاته، والأجسام، ونصوص المراجعات، وأسماء الفروع، ورسائل الالتزام بوصفها بيانات غير موثوقة في كامل هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تعمل عمليات CI اليدوية بنفس رسم الوظائف البياني مثل CI العادي، لكنها تفعّل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، ودخان البناء، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وتعريب Control UI. تعمل عمليات CI اليدوية المستقلة على Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android عبر تمرير `include_android=true`. تُستثنى من CI فحوصات ما قبل إصدار Plugin الساكنة، وجزء `agentic-plugins` الخاص بالإصدار فقط، ومسح دفعة الامتدادات الكامل، ومسارات Docker لما قبل إصدار Plugin. لا تعمل حزمة Docker لما قبل الإصدار إلا عندما تطلق `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تفعيل بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى حزمة مرشح الإصدار الكاملة بسبب تشغيل push أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني على فرع أو وسم أو SHA كامل لالتزام، مع استخدام ملف سير العمل من مرجع الإطلاق المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                         | الوظائف                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ووظائف الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، وفحوصات البروتوكول/العقد/المضمّنة السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء وتجميعات `check-additional`، ومحققات تجميع اختبارات Node، وفحوصات المستندات، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الامتدادات الأخف وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي للمعالج بحيث إن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلف وقت اصطفاف 32-vCPU أكثر مما وفر)                                                                                                                                                                                                                                                                                                                     |
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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## أداء OpenClaw

`OpenClaw Performance` هو سير عمل أداء المنتج ووقت التشغيل. يعمل يوميا على `main` ويمكن إطلاقه يدويا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

يقيس الإطلاق اليدوي عادة مرجع سير العمل. اضبط `target_ref` لقياس وسم إصدار أو فرع آخر باستخدام تنفيذ سير العمل الحالي. تُفهرس مسارات التقارير المنشورة والمؤشرات الأحدث حسب المرجع المختبر، ويسجل كل `index.md` المرجع/SHA المختبر، ومرجع/SHA سير العمل، ومرجع Kova، والملف الشخصي، ووضع مصادقة المسار، والنموذج، وعدد التكرارات، ومرشحات السيناريوهات.

يثبت سير العمل OCM من إصدار مثبت وKova من `openclaw/Kova` عند إدخال `kova_ref` المثبت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل بناء محلي بمصادقة OpenAI-compatible وهمية وحتمية.
- `mock-deep-profile`: تحليل CPU/heap/trace لنقاط الأداء الساخنة في بدء التشغيل، وGateway، ودورة الوكيل.
- `live-gpt54`: دورة وكيل OpenAI `openai/gpt-5.4` حقيقية، تُتخطى عندما لا يتوفر `OPENAI_API_KEY`.

يشغّل مسار mock-provider أيضا مجسات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات hello متكررة لـ `channel-chat-baseline` باستخدام mock-OpenAI؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار artifacts إلى GitHub. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يلتزم سير العمل أيضا بـ `report.json` و`report.md` والحزم و`index.md` وartifacts مجسات المصدر إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر المرجع المختبر الحالي باسم `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لعبارة "شغّل كل شيء قبل الإصدار." يقبل فرعا أو وسما أو SHA كامل لالتزام، ويطلق سير عمل `CI` اليدوي بذلك الهدف، ويطلق `Plugin Prerelease` لإثبات Plugin/الحزمة/الساكن/Docker الخاص بالإصدار فقط، ويطلق `OpenClaw Release Checks` لدخان التثبيت، وقبول الحزمة، وحزم مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضا `NPM Telegram Beta E2E` مقابل artifact باسم `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، واختلافات الملفات الشخصية، وartifacts، و
معالجات إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يجري تغييرات. أطلقه
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد npm الخاص بـ OpenClaw. يتحقق من `pnpm plugins:sync:check`،
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

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إطلاق سير عمل GitHub فروعا أو وسوما، لا SHA خامة للالتزامات. يدفع
المساعد فرع `release-ci/<sha>-...` مؤقتا عند SHA الهدف،
ويطلق `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل تابع يطابق الهدف، ويحذف الفرع المؤقت عند اكتمال
التشغيل. يفشل محقق المظلة أيضا إذا عمل أي سير عمل تابع عند
SHA مختلف.

`release_profile` يتحكم في نطاق live/provider الذي يُمرَّر إلى فحوصات الإصدار. تكون سير عمل الإصدار اليدوية افتراضيًا على `stable`؛ استخدم `full` فقط عندما تريد عمدًا مصفوفة provider/media الاستشارية الواسعة.

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة provider/backend المستقرة.
- يشغّل `full` مصفوفة provider/media الاستشارية الواسعة.

تسجّل المظلة معرّفات تشغيل الأبناء التي تم إرسالها، وتعيد مهمة `Verify full validation` النهائية فحص نتائج تشغيل الأبناء الحالية وتضيف جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل ابن وتحول إلى أخضر، فأعد تشغيل مهمة التحقق الأصلية فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للابن العادي الخاص بـ CI الكامل فقط، و`plugin-prerelease` لابن ما قبل إصدار Plugin فقط، و`release-checks` لكل ابن إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. هذا يُبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test` بتنسيق tarball، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker لمسار الإصدار live/E2E وشريحة قبول الحزمة. هذا يُبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة تغليف المرشح نفسه في عدة مهام أبناء.

عمليات تشغيل `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل ابن كان قد أرسله
عند إلغاء الأصل، لذلك لا يبقى تحقق main الأحدث خلف تشغيل فحص إصدار قديم مدته ساعتان. يحافظ تحقق فرع/وسم الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## شرائح Live وE2E

يحافظ ابن live/E2E الخاص بالإصدار على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشرائح مسماة عبر `scripts/test-live-shard.mjs` بدلًا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المصفاة حسب provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شرائح media الصوت/الفيديو المقسمة وشرائح الموسيقى المصفاة حسب provider

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص حالات فشل provider الحية البطيئة. تبقى أسماء الشرائح التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شرائح media الحية الأصلية داخل `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، الذي يبنيه سير عمل `Live Media Runner Image`. تثبّت تلك الصورة `ffmpeg` و`ffprobe` مسبقًا؛ لا تتحقق مهام media إلا من الثنائيات قبل الإعداد. أبقِ مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية؛ فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم شرائح live model/backend المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل commit محدد. يبني سير عمل live الخاص بالإصدار تلك الصورة ويدفعها مرة واحدة، ثم تعمل شرائح Docker live model وGateway المقسمة حسب provider وخلفية CLI وربط ACP وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شرائح Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل، بحيث يفشل مسار حاوية عالق أو تنظيف سريعًا بدلًا من استهلاك ميزانية فحص الإصدار كلها. إذا أعادت تلك الشرائح بناء هدف Docker الكامل من المصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مُعدّ بشكل خاطئ وسيهدر زمن الحائط على عمليات بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال: "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو يختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحدة عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يتحقق `resolve_package` من `workflow_ref`، ويحل مرشح حزمة واحدًا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد tarball، ويجهز صور Docker ذات ملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلًا من تغليف نسخة checkout الخاصة بسير العمل. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية ذات آثار فريدة.
3. يستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. يعمل عندما لا تكون `telegram_mode` هي `none` ويثبّت أثر `package-under-test` نفسه عندما يكون Package Acceptance قد حل حزمة؛ لا يزال بإمكان إرسال Telegram المستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول ما قبل الإصدار/الإصدار المستقر المنشور.
- يحزم `source=ref` فرع `package_ref` أو وسمه أو SHA commit كاملًا موثوقًا. يجلب محلل الحزمة فروع/وسوم OpenClaw، ويتحقق من أن commit المحدد قابل للوصول من تاريخ فروع المستودع أو وسم إصدار، ويثبت التبعيات في worktree منفصل، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عبر HTTPS؛ تكون `package_sha256` مطلوبة.
- ينزّل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي توفيرها للآثار المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو commit المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من commits مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزمة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافةً إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف `package` الشخصي تغطية Plugin غير متصلة بحيث لا يتوقف تحقق الحزمة المنشورة على توافر ClawHub الحي. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

للاطلاع على سياسة اختبار التحديثات وPlugin المخصصة، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات Package Acceptance، وافتراضيات الإصدار، وفرز حالات الفشل،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار المُعد، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=all-since-2026.4.23`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. هذا يُبقي إثبات ترحيل الحزمة والتحديث وتنظيف تبعيات Plugin القديمة وإصلاح تثبيت Plugin المهيأ وPlugin غير المتصل وتحديث Plugin وTelegram على tarball الحزمة المحلولة نفسها. عيّن `package_acceptance_package_spec` في Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلًا من الأثر المبني من SHA. لا تزال فحوصات إصدار Cross-OS تغطي سلوك الإعداد والتثبيت والمنصة الخاص بنظام التشغيل؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بـ Package Acceptance. يتحقق مسار Docker `published-upgrade-survivor` من أساس حزمة منشورة واحد لكل تشغيل. في Package Acceptance، تكون tarball `package-under-test` المحلولة هي المرشح دائمًا، وتحدد `published_upgrade_survivor_baseline` الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الأساس. عيّن `published_upgrade_survivor_baselines=all-since-2026.4.23` لتوسيع CI الخاص بـ Full Release عبر كل إصدار npm مستقر من `2026.4.23` حتى `latest`؛ يبقى `release-history` متاحًا لأخذ عينات يدوية أوسع باستخدام مرساة ما قبل التاريخ الأقدم. عيّن `published_upgrade_survivor_scenarios=reported-issues` لتوسيع الأسس نفسها عبر fixtures على شكل مشكلات لإعداد Feishu وملفات bootstrap/persona المحفوظة وتثبيتات OpenClaw Plugin المهيأة ومسارات السجلات التي تستخدم tilde وجذور تبعيات Plugin القديمة المتقادمة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو تنظيف تحديثات منشورة بشكل شامل، لا النطاق العادي لـ Full Release CI. يمكن للتشغيلات التجميعية المحلية تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريو. يهيئ المسار المنشور الأساس بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الطازجة للحزمة والتثبيت أيضًا من أن الحزمة المثبتة يمكنها استيراد تجاوز browser-control من مسار Windows خام مطلق. يستخدم فحص OpenAI cross-OS agent-turn الدخاني افتراضيًا `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند تعيينه، وإلا `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضيات GPT-4.x.

### نوافذ التوافق القديم

لدى Package Acceptance نوافذ توافق قديم محدودة للحزم المنشورة بالفعل. قد تستخدم الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من fixture git الوهمية المشتقة من tarball وقد يسجل `update.channel` محفوظًا مفقودًا؛
- قد تقرأ فحوصات Plugin الدخانية مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات metadata الخاصة بالإعداد مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تُصدر حزمة `2026.4.26` المنشورة أيضًا تحذيرًا بشأن ملفات ختم بيانات metadata الخاصة بالبناء المحلي التي شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. بعد ذلك افحص التشغيل الفرعي `docker_acceptance` ومصنوعات Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## فحص التثبيت السريع

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. ويقسّم تغطية الفحص السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تلمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام فحص Docker السريعة. تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات التوثيق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذر مرة واحدة، ويتحقق من CLI، ويشغّل فحص CLI لحذف الوكلاء لمساحة العمل المشتركة، ويشغّل اختبار e2e لحاوية gateway-network، ويتحقق من وسيطة بناء لإضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود للـ Plugin المضمّن ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع تحديد تشغيل Docker لكل سيناريو بشكل منفصل).
- **المسار الكامل** يحتفظ بتغطية تثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والتشغيلات اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلياً أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة فحص Dockerfile الجذر من GHCR لهدف SHA واحد، ثم يشغّل تثبيت حزمة QR، وفحوصات Dockerfile/Gateway الجذر، وفحوصات المثبّت/التحديث، واختبار Docker E2E السريع للـ Plugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف فحوصات صورة الجذر.

دفعات `main` (بما في ذلك commits الدمج) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند دفع، يحتفظ سير العمل بفحص Docker السريع ويترك فحص التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

فحص موفر الصورة لتثبيت Bun العمومي البطيء محكوم بشكل منفصل بواسطة `run_bun_global_install_smoke`. يعمل ضمن الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن للتشغيلات اليدوية لـ `Install Smoke` الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile المركّزة على التثبيت الخاصة بها.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة واحدة مسبقاً، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت أرشيف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ومنطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفّذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للموفر.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا تقوم الموفرات بالتقييد.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تأخير متدرج بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ عيّن `0` لعدم وجود تأخير.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حي/ذيل محددة حدوداً أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى فحص التنظيف السريع حتى يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعّال أن يبدأ من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تجري التجميعة المحلية فحوصات تمهيدية لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولاً، وتتوقف افتراضياً عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير عمل حي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة الحية والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل مصنوع حزمة من التشغيل الحالي، أو ينزّل مصنوع حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون أرشيف tarball؛ ويبني ويدفع صور GHCR Docker E2E العارية/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلاً من إعادة البناء. تعاد محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعاً سيل سجل/ذاكرة مؤقتة عالق بدلاً من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار في مهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفّذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي اليدوي لإعادة التشغيل لكلا مساري مثبّت الموفر.

يُضم OpenWebUI إلى `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط للتشغيلات الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند حالات فشل شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مُدخل سير العمل `docker_lanes` المسارات المحددة مقابل الصور المجهزة بدلاً من مهام الأجزاء، مما يبقي تصحيح المسار الفاشل محدوداً في مهمة Docker مستهدفة واحدة ويجهّز أو ينزّل أو يعيد استخدام مصنوع الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker حياً، تبني المهمة المستهدفة صورة الاختبار الحي محلياً لإعادة التشغيل تلك. تتضمن أوامر إعادة التشغيل المولّدة لكل مسار في GitHub `package_artifact_run_id` و`package_artifact_name` ومدخلات الصورة المجهزة عندما تكون تلك القيم موجودة، حتى يتمكن مسار فاشل من إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير عمل حي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يومياً.

## الإصدار التمهيدي للـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو سير عمل منفصل يطلقه `Full Release Validation` أو مشغّل صريح. لا تشغّل طلبات السحب العادية، ودفعات `main`، وتشغيلات CI اليدوية المستقلة تلك المجموعة. يوازن اختبارات Plugin المضمّن عبر ثمانية عمال للإضافات؛ تشغّل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي إعدادات Plugin في كل مرة، مع عامل Vitest واحد لكل مجموعة وكومة Node أكبر حتى لا تنشئ دفعات Plugin الثقيلة الاستيراد مهام CI إضافية. يجمع مسار الإصدار التمهيدي الخاص بـ Docker والمخصص للإصدار فقط مسارات Docker المستهدفة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام تستغرق من دقيقة إلى ثلاث دقائق.

## مختبر QA

يملك مختبر QA مسارات CI مخصصة خارج سير العمل الذكي الرئيسي محدد النطاق. التكافؤ الوكيلي متداخل تحت أحزمة QA والإصدار الواسعة، وليس سير عمل مستقلاً لطلبات السحب. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما يجب أن يرافق التكافؤ تشغيل تحقق واسعاً.

- يشغّل سير عمل `QA-Lab - All Lanes` ليلياً على `main` وعند التشغيل اليدوي؛ ويوسع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين مع الموفر الوهمي الحتمي والنماذج المؤهلة وهمياً (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يكون عقد القناة معزولاً عن كمون النموذج الحي وبدء تشغيل Plugin الموفر العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النموذج الحي والموفر الأصلي وموفر Docker المنفصلة اتصال الموفر.

تستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمها CLI المسحوب. يظل الإعداد الافتراضي لـ CLI ومُدخل سير العمل اليدوي `all`؛ تشغيل `matrix_profile=all` اليدوي يقسم دائماً تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضاً مسارات مختبر QA الحرجة للإصدار قبل الموافقة على الإصدار؛ تشغّل بوابة تكافؤ QA الخاصة به حزمي المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا المصنوعين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحوصات محددة النطاق بدلاً من معاملة التكافؤ كحالة مطلوبة.

## CodeQL

يُعد سير عمل `CodeQL` ماسح أمان أوليًا ضيق النطاق عن قصد، وليس فحصًا شاملًا للمستودع بالكامل. تفحص تشغيلات الحماية اليومية واليدوية وتشغيلات حماية طلبات السحب غير المسودة كود سير عمل Actions بالإضافة إلى أسطح JavaScript/TypeScript الأعلى خطرًا باستخدام استعلامات أمان عالية الثقة مصفاة إلى `security-severity` عالٍ/حرج.

تظل حماية طلب السحب خفيفة: فهي لا تبدأ إلا للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغل مصفوفة الأمان عالية الثقة نفسها التي يشغلها سير العمل المجدول. يبقى Android وmacOS CodeQL خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | النطاق                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط الأساس للمصادقة والأسرار وصندوق العزل وCron وGateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية بالإضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                     |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                       |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android المجدول. يبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. يرفع النتائج ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS أسبوعي/يدوي. يبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، ويصفي نتائج بناء التبعيات خارج SARIF المرفوع، ويرفع النتائج ضمن `/codeql-critical-security/macos`. يُبقى خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. لا يشغل إلا استعلامات جودة JavaScript/TypeScript غير أمنية وبمستوى خطورة الأخطاء فقط، على أسطح ضيقة عالية القيمة، على مشغّل Blacksmith Linux الأصغر. حماية طلب السحب الخاصة به أصغر عمدًا من ملف التعريف المجدول: لا تشغل طلبات السحب غير المسودة إلا الأجزاء المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمنة، وعقد بروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/غراء SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل رد Plugin SDK. تشغل تغييرات إعدادات CodeQL وسير عمل الجودة أجزاء جودة طلبات السحب الاثني عشر كلها.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي أدوات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل.

| الفئة                                                  | النطاق                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وصندوق العزل وCron وGateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات، والترحيل، والتطبيع، وعقود الإدخال والإخراج                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وإرسال النماذج/المزوّدين، وإرسال الرد التلقائي وطوابيره، وعقود وقت تشغيل مستوى التحكم ACP                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات مراقبة العمليات، وعقود التسليم الصادر                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وغراء تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسة/المؤشر                      |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وإعدادات/كتالوجات المزوّد الافتراضية، وسجلات الويب/البحث/الجلب/التضمين              |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                         |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقد حزمة Plugin                                                                                                   |

تبقى الجودة منفصلة عن الأمان كي يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون إخفاء إشارة الأمان. ينبغي أن تُعاد إضافة توسيع CodeQL لـ Swift وPython وPlugin المضمنة كعمل متابعة محدد النطاق أو مجزأ فقط بعد أن تستقر ملفات التعريف الضيقة من حيث وقت التشغيل والإشارة.

## تدفقات عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي هبطت مؤخرًا. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح لدفع غير صادر عن بوت على `main` أن يفعّله، ويمكن للتشغيل اليدوي أن يشغله مباشرة. تتخطى الاستدعاءات عبر workflow-run عندما يكون `main` قد تقدم أو عندما يكون قد أُنشئ تشغيل `Docs Agent` غير متخطى آخر في آخر ساعة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ `Docs Agent` إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولًا خالصًا: يمكن لتشغيل CI ناجح لدفع غير صادر عن بوت على `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء workflow-run آخر قد شُغّل أو قيد التشغيل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعًا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبار صغيرة فقط مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يتضمن اختبارات فاشلة، فيجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل أن تهبط دفعة البوت، يعيد المسار تأسيس التصحيح المتحقق منه، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ وتتخطى التصحيحات القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub كي يستطيع إجراء Codex الحفاظ على وضع السلامة نفسه دون sudo مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يكون افتراضيًا تجربة جافة ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الهابط قد دُمج وأن كل تكرار يملك إما مسألة مشتركة مشارًا إليها أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلي وتوجيه التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلي هذه أكثر صرامة بخصوص حدود البنية من نطاق منصة CI الواسع:

- تشغل تغييرات إنتاج النواة فحص أنواع إنتاج النواة واختبار النواة بالإضافة إلى lint/الحراس للنواة؛
- تشغل تغييرات اختبارات النواة فقط فحص أنواع اختبارات النواة بالإضافة إلى lint للنواة؛
- تشغل تغييرات إنتاج الامتدادات فحص أنواع إنتاج الامتداد واختبار الامتداد بالإضافة إلى lint للامتداد؛
- تشغل تغييرات اختبارات الامتداد فقط فحص أنواع اختبارات الامتداد بالإضافة إلى lint للامتداد؛
- تتوسع تغييرات Plugin SDK العامة أو عقد Plugin إلى فحص أنواع الامتدادات لأن الامتدادات تعتمد على عقود النواة هذه (تبقى فحوصات Vitest الشاملة للامتدادات عمل اختبار صريحًا)؛
- تشغل زيادات الإصدارات الخاصة ببيانات الإصدار فقط فحوصات مستهدفة للإصدار/الإعدادات/تبعية الجذر؛
- تفشل تغييرات الجذر/الإعدادات غير المعروفة بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تشغيل تعديلات الاختبارات المباشرة لنفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والتابعين في مخطط الاستيراد. إعداد تسليم غرف المجموعات المشتركة هو أحد الخرائط الصريحة: تمر التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجه نظام أداة الرسائل عبر اختبارات الرد الأساسية بالإضافة إلى تراجعات تسليم Discord وSlack كي يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا بما يكفي على مستوى عدة الاختبار بحيث لا تكون المجموعة الرخيصة المعينة وكيلًا موثوقًا.

## تحقق Testbox

شغّل Testbox من جذر المستودع، وفضّل صندوقًا جديدًا مُسخّنًا لإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة سريعًا عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml`، أو عندما يعرض `git status --short` ما لا يقل عن 200 عملية حذف متتبعة. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من طلب السحب؛ أوقف ذلك الصندوق وسخّن صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. لطلبات السحب التي تتضمن عمليات حذف كبيرة مقصودة، اضبط `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. اضبط `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو غلاف الصناديق البعيدة المملوك للمستودع لإثبات Linux الخاص بالمشرفين. استخدمه عندما يكون الفحص أوسع من حلقة تحرير محلية، أو عندما تهم مطابقة CI، أو عندما يحتاج الإثبات إلى أسرار، أو Docker، أو مسارات حزم، أو صناديق قابلة لإعادة الاستخدام، أو سجلات بعيدة. خلفية OpenClaw العادية هي `blacksmith-testbox`؛ وتُعد سعة AWS/Hetzner المملوكة بديلًا احتياطيًا عند أعطال Blacksmith، أو مشكلات الحصة، أو الاختبار الصريح على السعة المملوكة.

قبل التشغيل الأول، افحص الغلاف من جذر المستودع:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

يرفض غلاف المستودع ملف Crabbox ثنائيًا قديمًا لا يعلن `blacksmith-testbox`. مرّر المزوّد صراحةً رغم أن `.crabbox.yaml` يحتوي على افتراضات السحابة المملوكة.

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

اقرأ ملخص JSON النهائي. الحقول المفيدة هي `provider` و`leaseId` و`syncDelegated` و`exitCode` و`commandMs` و`totalMs`. ينبغي لتشغيلات Crabbox أحادية الاستخدام المدعومة من Blacksmith أن توقف Testbox تلقائيًا؛ إذا انقطع التشغيل أو لم يكن التنظيف واضحًا، فافحص الصناديق الحية وأوقف فقط الصناديق التي أنشأتها:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

استخدم إعادة الاستخدام فقط عندما تحتاج عمدًا إلى أوامر متعددة على الصندوق نفسه بعد تهيئته:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

إذا كانت طبقة Crabbox هي المعطلة لكن Blacksmith نفسه يعمل، فاستخدم Blacksmith مباشرةً كبديل احتياطي محدود:

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

يمتلك `.crabbox.yaml` افتراضات المزوّد والمزامنة وتهيئة GitHub Actions لمسارات السحابة المملوكة. يستثني `.git` المحلي بحيث يحتفظ استنساخ Actions المُهيأ ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة المستودعات البعيدة ومخازن الكائنات المحلية الخاصة بالمشرف، ويستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يمتلك `.github/workflows/crabbox-hydrate.yml` عملية الاستنساخ، وإعداد Node/pnpm، وجلب `origin/main`، وتمرير البيئة غير السرية لأوامر السحابة المملوكة `crabbox run --id <cbx_id>`.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

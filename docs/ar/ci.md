---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت بصدد تصحيح فشل في فحص GitHub Actions
    - أنت تنسّق تشغيلًا للتحقق من الإصدار أو إعادة تشغيله
summary: رسم بياني لوظائف CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-04-30T07:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

يدير OpenClaw CI على كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروق وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز عمليات تشغيل `workflow_dispatch` اليدوية تحديد النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. تقع تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin ما قبل الإصدار`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                            | الغرض                                                                                        | متى تعمل                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والامتدادات المتغيرة، وبناء بيان CI          | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                         | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج دون اعتماديات مقابل تنبيهات npm                                        | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                             | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip للإنتاج للاعتماديات فقط، مع حارس قائمة السماح للملفات غير المستخدمة             | تغييرات ذات صلة بـ Node            |
| `build-artifacts`                | بناء `dist/`، وواجهة Control UI، وفحوصات الآثار المبنية، وآثار قابلة لإعادة الاستخدام لاحقًا | تغييرات ذات صلة بـ Node            |
| `checks-fast-core`               | مسارات صحة سريعة على Linux مثل فحوصات المضمن/عقد Plugin/البروتوكول                           | تغييرات ذات صلة بـ Node            |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى أجزاء مع نتيجة فحص تجميعية ثابتة                            | تغييرات ذات صلة بـ Node            |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والمضمن والعقود والامتدادات            | تغييرات ذات صلة بـ Node            |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والLint، والحراس، وأنواع الاختبار، وفحص smoke صارم | تغييرات ذات صلة بـ Node            |
| `check-additional`               | أجزاء البنية، والحدود، وحراس سطح الامتدادات، وحدود الحزم، ومراقبة Gateway                   | تغييرات ذات صلة بـ Node            |
| `build-smoke`                    | اختبارات smoke لـ CLI المبني وفحص smoke لذاكرة بدء التشغيل                                   | تغييرات ذات صلة بـ Node            |
| `checks`                         | متحقق لاختبارات قنوات الآثار المبنية                                                        | تغييرات ذات صلة بـ Node            |
| `checks-node-compat-node22`      | مسار بناء وتحقق smoke للتوافق مع Node 22                                                     | تشغيل CI يدوي للإصدارات           |
| `check-docs`                     | تنسيق التوثيق، والLint، وفحوصات الروابط المعطلة                                             | عند تغير التوثيق                   |
| `skills-python`                  | Ruff + pytest لـ Skills المدعومة بـ Python                                                   | تغييرات ذات صلة بـ Skills في Python |
| `checks-windows`                 | اختبارات عمليات/مسارات خاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة | تغييرات ذات صلة بـ Windows         |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام الآثار المبنية المشتركة                            | تغييرات ذات صلة بـ macOS           |
| `macos-swift`                    | Swift lint والبناء والاختبارات لتطبيق macOS                                                  | تغييرات ذات صلة بـ macOS           |
| `android`                        | اختبارات وحدة Android لكلتا النكهتين إضافة إلى بناء APK واحد للتصحيح                         | تغييرات ذات صلة بـ Android         |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                            | نجاح CI الرئيسي أو تشغيل يدوي      |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليسا مهمتين مستقلتين.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام الآثار الأثقل ومصفوفة المنصات.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة كي يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. تتوسع بعد ذلك مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تجاوزها تشغيل أحدث على أنها `cancelled` عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` بحيث تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تم تجاوزه بالفعل. مفتاح التزامن التلقائي لـ CI مُصدّر بإصدار (`CI-v7-*`) كي لا يستطيع تشغيل عالق من جهة GitHub في مجموعة صف قديمة حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات تشغيل المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي عمليات التشغيل الجارية.

## النطاق والتوجيه

يقع منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI البياني لـ Node إضافة إلى lint لسير العمل، لكنها لا تفرض وحدها بناءات Windows أو Android أو macOS الأصلية؛ تبقى مسارات المنصات هذه محددة بتغييرات مصادر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات تجهيزات اختبارات core رخيصة مختارة، وتعديلات مساعد/اختبار توجيه ضيقة لعقد Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، وأجزاء core الكاملة، وأجزاء Plugin المضمنة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Node على Windows** محددة بمغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغّل npm/pnpm/UI، وإعداد مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin وinstall-smoke والاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تُقسّم أو تُوازن أبطأ عائلات اختبارات Node بحيث تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتُقرن مسارات وحدات core الصغيرة، ويعمل auto-reply بأربعة عمال متوازنين (مع تقسيم الشجرة الفرعية للرد إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتُوزع إعدادات Gateway/Plugin الوكيلية عبر مهام Node الوكيلية القائمة الخاصة بالمصدر فقط بدل الانتظار على الآثار المبنية. تستخدم اختبارات المتصفح وQA والوسائط وPlugin المتنوعة الواسعة إعدادات Vitest المخصصة لها بدل مجمّع Plugin المشترك. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` التمييز بين إعداد كامل وجزء مرشح. يُبقي `check-additional` عمل تجميع/Canary حدود الحزم معًا، ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ ويشغّل جزء حارس الحدود حراسه الصغيرة المستقلة بالتوازي داخل مهمة واحدة. تعمل مراقبة Gateway، واختبارات القنوات، وجزء حدود دعم core بالتوازي داخل `build-artifacts` بعد بناء `dist/` و`dist-runtime/` بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصادر أو بيانًا منفصلًا؛ ما زال مسار اختبارات الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/call-log، مع تجنب مهمة تغليف debug APK مكررة في كل دفع ذي صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip للإنتاج للاعتماديات فقط مثبتة على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر إصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع، أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية المقصودة، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم التي لا يستطيع Knip حلها ساكنًا.

## عمليات التشغيل اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادي، لكنها تفرض تشغيل كل مسار محدد النطاق غير Android: أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وbuild smoke، وفحوصات التوثيق، وSkills في Python، وWindows، وmacOS، وControl UI i18n. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستثنى فحوصات Plugin الثابتة لما قبل الإصدار، وجزء `agentic-plugins` الخاص بالإصدار فقط، والمسح الدفعي الكامل للامتدادات، ومسارات Docker لما قبل إصدار Plugin من CI. لا تعمل مجموعة Docker لما قبل الإصدار إلا عندما يشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة تحقق الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة بحيث لا تلغي دفعة أخرى أو تشغيل طلب سحب على المرجع نفسه مجموعة كاملة لمرشح إصدار. يتيح إدخال `target_ref` الاختياري لمستدع موثوق تشغيل ذلك الرسم البياني على فرع أو وسم أو SHA كامل للالتزام مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، وفحوصات البروتوكول/العقد/المضمّنة السريعة، وفحوصات عقود القنوات المقسّمة، وأجزاء `check` باستثناء الفحص اللمطي، وأجزاء `check-additional` وتجميعاتها، ومحقّقات تجميع اختبارات Node، وفحوصات التوثيق، وSkills الخاصة بـ Python، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضا Ubuntu المستضاف على GitHub لكي تتمكن مصفوفة Blacksmith من الاصطفاف مبكرا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء Plugin الأخف وزنا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبار Linux Node، وأجزاء اختبار Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس بما يكفي لاستهلاك CPU بحيث كلفت 8 vCPU أكثر مما وفرت)؛ وبنى Docker الخاصة بـ install-smoke (كلف وقت صف 32-vCPU أكثر مما وفر)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود التفريعات إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` هو سير العمل اليدوي الجامع لـ "تشغيل كل شيء قبل الإصدار." يقبل فرعا أو وسما أو SHA كاملا للالتزام، ويشغّل سير عمل `CI` اليدوي بذلك الهدف، ويشغّل `Plugin Prerelease` لإثباتات Plugin/package/static/Docker الخاصة بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لفحص التثبيت، وقبول الحزمة، ومجموعات مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. يمكنه أيضا تشغيل سير عمل `NPM Telegram Beta E2E` بعد النشر عند توفير مواصفة حزمة منشورة.

يتحكم `release_profile` في نطاق التغطية الحية/المزوّدين الممرر إلى فحوصات الإصدار:

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّدين/الخلفيات المستقرة.
- يشغّل `full` مصفوفة المزوّدين/الوسائط الاستشارية الواسعة.

يسجل سير العمل الجامع معرّفات تشغيل الأبناء التي تم تشغيلها، وتعيد مهمة `Verify full validation` النهائية فحص استنتاجات تشغيل الأبناء الحالية وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أعيد تشغيل سير عمل ابن وتحول إلى أخضر، فأعد تشغيل مهمة التحقق الأب فقط لتحديث نتيجة سير العمل الجامع وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` قيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للابن العادي الخاص بـ CI الكامل فقط، و`release-checks` لكل ابن إصدار، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على سير العمل الجامع. يبقي هذا إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم تمرر ذلك الأثر إلى كل من سير عمل Docker لمسار الإصدار الحي/E2E وجزء قبول الحزمة. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تغليف المرشح نفسه في عدة مهام أبناء.

## الأجزاء الحية وأجزاء E2E

يحافظ ابن الإصدار الحي/E2E على تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

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
- أجزاء الصوت/الفيديو للوسائط المقسمة وأجزاء الموسيقى المفلترة حسب المزوّد

يحافظ ذلك على تغطية الملفات نفسها مع تسهيل إعادة تشغيل وتشخيص أعطال المزوّدين الحية البطيئة. تظل أسماء أجزاء التجميع `native-live-extensions-o-z`، و`native-live-extensions-media`، و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبني بواسطة سير عمل `Live Media Runner Image`. تثبّت تلك الصورة `ffmpeg` و`ffprobe` مسبقا؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق مجموعات الاختبار الحية المدعومة بـ Docker على مشغّلات Blacksmith العادية، فمهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker متداخلة.

تستخدم أجزاء النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي وGateway وخلفية CLI وربط ACP وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل من المصدر بشكل مستقل، فإعداد تشغيل الإصدار خاطئ وسيهدر وقتا فعليا على بنى صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يسحب `resolve_package` ‏`workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` ‏`openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزّل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من مخزون tarball، ويحضّر صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغّل مسارات Docker المحددة ضد تلك الحزمة بدلا من تغليف نسخة سير العمل المسحوبة. عندما يحدد ملف شخصي عدة `docker_lanes` موجهة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker موجهة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت أثر `package-under-test` نفسه عندما يكون Package Acceptance قد حل واحدا؛ ولا يزال بإمكان تشغيل Telegram مستقل تثبيت مواصفة npm منشورة.
4. تفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعًا أو وسمًا أو SHA كاملًا موثوقًا من `package_ref`. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد يمكن الوصول إليه من سجل فرع المستودع أو وسم إصدار، ويثبّت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- يحمّل `source=url` ملف HTTPS بامتداد `.tgz`؛ يكون `package_sha256` مطلوبًا.
- يحمّل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ يكون `package_sha256` اختياريًا لكن ينبغي توفيره للآثار المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/عدة الاختبار الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يُحزم عندما يكون `source=ref`. يتيح هذا لعدة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف المجموعة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما يكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin بلا اتصال حتى لا يعتمد التحقق من الحزمة المنشورة على إتاحة ClawHub المباشرة. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسال المستقل.

تستدعي فحوصات الإصدار Package Acceptance باستخدام `source=ref` و`package_ref=<release-ref>` و`workflow_ref=<release workflow ref>` و`suite_profile=custom` و`docker_lanes='bundled-channel-deps-compat plugins-offline'` و`telegram_mode=mock-openai`. تغطي أجزاء Docker لمسار الإصدار مسارات الحزمة/التحديث/Plugin المتداخلة؛ ويحافظ Package Acceptance على إثبات توافق القنوات المضمّنة الأصلي للأثر، وPlugin بلا اتصال، وTelegram، مقابل ملف tarball نفسه للحزمة المحلولة. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بـ Package Acceptance. تتحقق مسارات الحزمة والمثبّت الجديد على Windows أيضًا من أن الحزمة المثبتة يمكنها استيراد تجاوز تحكم بالمتصفح من مسار Windows مطلق خام. يستخدم اختبار دخان دورة وكيل OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيًا عند ضبطه، وإلا يستخدم `openai/gpt-5.4-mini`، حتى يبقى إثبات التثبيت وGateway سريعًا وحتميًا.

### نوافذ التوافق القديمة

لدى Package Acceptance نوافذ توافق قديمة محدودة للحزم المنشورة مسبقًا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من ملف tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` اعتماديات `pnpm.patchedDependencies` المفقودة من نموذج git الزائف المشتق من ملف tarball وقد يسجل فقدان `update.channel` المستمر؛
- قد تقرأ اختبارات دخان Plugin مواقع سجل تثبيت قديمة أو تقبل فقدان استمرارية سجل تثبيت marketplace؛
- قد يسمح `plugin-update` بترحيل بيانات وصف التكوين مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضًا من ملفات ختم بيانات وصف البناء المحلي التي شُحنت مسبقًا. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الحالات نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل Package Acceptance فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` وآثار Docker الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## دخان التثبيت

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها وظائف دخان Docker. تغييرات Plugin المضمّن الخاصة بالمصدر فقط، وتعديلات الاختبارات فقط، وتعديلات الوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل دخان CLI لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل اختبار gateway-network e2e في الحاوية، ويتحقق من معامل بناء امتداد مضمّن، ويشغّل ملف تعريف Docker المحدود لـPlugin المضمّن ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- يبقي **المسار الكامل** تثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، والإرسال اليدوي، وفحوصات إصدار workflow-call، وطلبات السحب التي تلمس فعلًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke صورة دخان GHCR مستهدفة لـSHA الحالي من Dockerfile الجذري أو يعيد استخدامها، ثم يشغّل تثبيت حزمة QR، ودخان Dockerfile/Gateway الجذري، ودخان المثبّت/التحديث، وDocker E2E السريع لـPlugin المضمّن كوظائف منفصلة حتى لا ينتظر عمل المثبّت خلف دخان الصورة الجذرية.

لا تفرض دفعات `main` (بما فيها التزامات الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغيير تغطية كاملة عند الدفع، يحافظ سير العمل على دخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يُحرس دخان مزود الصورة لتثبيت Bun العام البطيء بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل على الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لإرسالات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها المركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقًا صورة اختبار مباشر مشتركة واحدة، ويحزم OpenClaw مرة واحدة كملف tarball من npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتماديات Plugin؛
- صورة وظيفية تثبّت ملف tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### القيم القابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات المجموعة الرئيسية للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات مجموعة الذيل الحساسة للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات المباشرة المتزامنة حتى لا تخنق المزودات.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | التأخير بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم التأخير.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات مباشرة/ذيلية محددة حدودًا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى دخان التنظيف حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعال أن يبدأ مع ذلك من مجموعة فارغة، ثم يعمل بمفرده حتى يحرر السعة. تنفذ عملية التجميع المحلية فحوصات Docker المسبقة، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولًا، وتتوقف افتراضيًا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل مباشر/E2E قابل لإعادة الاستخدام

يسأل سير العمل المباشر/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة المباشرة والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات GitHub وملخصات. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو يحمّل أثر حزمة من التشغيل الحالي، أو يحمّل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون ملف tarball؛ ويبني ويدفع صور GHCR Docker E2E العارية/الوظيفية الموسومة بملخص الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker من Blacksmith عندما تحتاج الخطة إلى مسارات ذات حزمة مثبتة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. تُعاد محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعيد تدفق سجل/ذاكرة تخزين مؤقت عالق المحاولة بسرعة بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كوظائف أصغر مقسمة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ مسارات متعددة عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

تجزئات Docker للإصدار الحالي هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h` و`bundled-channels-core` و`bundled-channels-update-a` و`bundled-channels-update-discord` و`bundled-channels-update-b` و`bundled-channels-contracts`. تظل التجزئة التجميعية `bundled-channels` متاحة لإعادة التشغيل اليدوية لمرة واحدة، وتظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري تثبيت المزوّد. تشغّل تجزئة `bundled-channels` مسارات `bundled-channel-*` و`bundled-channel-update-*` المقسّمة بدلًا من مسار `bundled-channel-deps` التسلسلي الجامع.

يُضمّن OpenWebUI داخل `plugins-runtime-services` عندما تطلبه تغطية مسار الإصدار الكاملة، ويحتفظ بتجزئة مستقلة `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند حدوث إخفاقات عابرة في شبكة npm.

ترفع كل تجزئة `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل إدخال سير العمل `docker_lanes` المسارات المحددة مقابل الصور المُحضّرة بدلًا من وظائف التجزئة، ما يُبقي تصحيح المسار الفاشل محدودًا بوظيفة Docker واحدة مستهدفة، ويحضّر أو ينزّل أو يعيد استخدام أثر الحزمة لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker حيًا، فإن الوظيفة المستهدفة تبني صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر GitHub المُنشأة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المُحضّرة عند وجود تلك القيم، بحيث يمكن لمسار فاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## ما قبل إصدار Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى كلفة، لذلك فهو سير عمل منفصل يُرسل بواسطة `Full Release Validation` أو بواسطة مشغّل صريح. تُبقي طلبات السحب العادية، ودفعات `main`، وعمليات الإرسال اليدوية المستقلة لـ CI هذه المجموعة معطلة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال امتدادات؛ وتشغّل وظائف تجزئة الامتدادات هذه ما يصل إلى مجموعتي تكوين Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة Node أكبر، حتى لا تنشئ دفعات Plugin كثيفة الاستيراد وظائف CI إضافية.

## مختبر QA

لمختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي.

- يعمل سير العمل `Parity gate` عند تغييرات PR المطابقة والإرسال اليدوي؛ فيبني وقت تشغيل QA الخاص ويقارن حزم الوكلاء الوظيفية الوهمية GPT-5.5 وOpus 4.6.
- يعمل سير العمل `QA-Lab - All Lanes` كل ليلة على `main` وعند الإرسال اليدوي؛ ويوزّع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كوظائف متوازية. تستخدم الوظائف الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود إيجار Convex.

تشغّل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين مع مزوّد وهمي حتمي ونماذج مؤهلة وهميًا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن تأخر النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطّل Gateway النقل الحي البحث في الذاكرة لأن تكافؤ QA يغطي سلوك الذاكرة بشكل منفصل؛ وتُغطى قابلية اتصال المزوّد بواسطة مجموعات النموذج الحي، والمزوّد الأصلي، ومزوّد Docker المنفصلة.

يستخدم Matrix `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمها CLI الذي تم سحبه. يظل الإعداد الافتراضي لـ CLI وإدخال سير العمل اليدوي `all`؛ ويجزّئ إرسال `matrix_profile=all` اليدوي دائمًا تغطية Matrix الكاملة إلى وظائف `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات مختبر QA الحرجة للإصدار قبل الموافقة على الإصدار؛ وتشغّل بوابة تكافؤ QA الخاصة به حزم المرشح والأساس كوظائف مسارات متوازية، ثم تنزّل كلا الأثرين إلى وظيفة تقرير صغيرة للمقارنة النهائية للتكافؤ.

لا تضع مسار هبوط PR خلف `Parity gate` إلا إذا كان التغيير يمس فعليًا وقت تشغيل QA، أو تكافؤ حزم النماذج، أو سطحًا يملكه سير عمل التكافؤ. بالنسبة لإصلاحات القنوات العادية، أو التكوين، أو الوثائق، أو اختبارات الوحدة، تعامل معه كإشارة اختيارية واتبع أدلة CI/الفحص ذات النطاق المحدد بدلًا من ذلك.

## CodeQL

سير العمل `CodeQL` هو ماسح أمان ضيق للمرور الأول عمدًا، وليس مسحًا كاملًا للمستودع. تفحص عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions إضافة إلى أسطح JavaScript/TypeScript الأعلى خطرًا باستخدام استعلامات أمان عالية الثقة مفلترة إلى `security-severity` عالٍ/حرج.

يبقى حارس طلب السحب خفيفًا: فهو يبدأ فقط للتغييرات تحت `.github/actions` أو`.github/codeql` أو`.github/workflows` أو`packages` أو`src`، ويشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، الأسرار، الصندوق الرملي، Cron، وخط أساس Gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القناة الأساسية إضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق                    |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتجهيز اعتماديات وقت التشغيل، وتحميل المصدر، وعقد حزمة Plugin SDK                 |

### تجزئات أمان خاصة بالمنصة

- `CodeQL Android Critical Security` — تجزئة أمان Android مجدولة. تبني تطبيق Android يدويًا لـ CodeQL على أصغر مشغّل Blacksmith Linux تقبله سلامة سير العمل. ترفع تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — تجزئة أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا لـ CodeQL على Blacksmith macOS، وتفلتر نتائج بناء الاعتماديات من SARIF المرفوع، وترفع تحت `/codeql-critical-security/macos`. محفوظة خارج الإعدادات الافتراضية اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي التجزئة غير الأمنية المطابقة. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية وبشدة خطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حارس طلب السحب الخاص بها أصغر عمدًا من الملف المجدول: لا تشغّل طلبات السحب غير المسودة إلا تجزئات `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة عند تغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، أو كود مخطط/ترحيل/إدخال وإخراج التكوين، أو كود المصادقة/الأسرار/الصندوق الرملي/الأمان، أو وقت تشغيل القناة الأساسية وPlugin القناة المضمّنة، أو بروتوكول Gateway/طريقة الخادم، أو وقت تشغيل الذاكرة/ربط SDK، أو MCP/العمليات/التسليم الصادر، أو وقت تشغيل المزوّد/كتالوج النماذج، أو تشخيصات الجلسة/صفوف التسليم، أو محمّل Plugin، أو عقد حزمة Plugin SDK، أو وقت تشغيل رد Plugin SDK. تشغّل تغييرات تكوين CodeQL وسير عمل الجودة جميع تجزئات جودة PR الاثنتي عشرة.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي خطافات تعليم/تكرار لتشغيل تجزئة جودة واحدة بمعزل.

| الفئة                                                | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | المصادقة، والأسرار، وبيئة العزل، وcron، وكود حدود أمان Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات، والترحيل، والتطبيع، وعقود الإدخال/الإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرائق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القنوات الأساسية وPlugin القنوات المجمعة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوجيه النماذج/الموفرين، وتوجيه الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، وواجهات وقت تشغيل الذاكرة، وأسماء SDK المستعارة لذاكرة Plugin، وطبقة ربط تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | الأجزاء الداخلية لطابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تقسيمها إلى مقاطع/وقت التشغيل، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسات/السلاسل             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع فهرس النماذج، ومصادقة الموفرين واكتشافهم، وتسجيل وقت تشغيل الموفرين، وافتراضات/فهارس الموفرين، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تهيئة واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت التشغيل لجلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جهة الحزمة ومساعدات عقود حزم Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. يجب إعادة إضافة توسيع CodeQL الخاص بـ Swift وPython وPlugin المجمعة كعمل متابعة محدود النطاق أو مقسم فقط بعد أن تستقر الملفات الشخصية الضيقة من حيث وقت التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث للحفاظ على توافق الوثائق الحالية مع التغييرات التي هبطت مؤخرًا. لا يملك جدولًا زمنيًا خالصًا: يمكن لتشغيل CI ناجح بدفعة غير آلية على `main` أن يشغله، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أُنشئ خلال الساعة الماضية. عند تشغيله، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، لذا يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر تمرير للوثائق.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولًا زمنيًا خالصًا: يمكن لتشغيل CI ناجح بدفعة غير آلية على `main` أن يشغله، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد شُغّل أو قيد التشغيل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. ينشئ المسار تقرير أداء Vitest مجمعًا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبار صغيرة تحافظ على التغطية فقط بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان لدى خط الأساس اختبارات فاشلة، يمكن لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفعة البوت، يعيد المسار بناء التصحيح المتحقق منه فوقه، ويعيد تشغيل `pnpm check:changed`، ويحاول الدفع مجددًا؛ ويتم تخطي التصحيحات القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع أمان إسقاط sudo نفسه مثل وكيل الوثائق.

### PRs مكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. افتراضيًا يعمل كتجربة جافة ولا يغلق إلا PRs المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الذي هبط مدمج وأن كل تكرار لديه إما مشكلة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتنفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تشغّل تغييرات الإنتاج الأساسية فحص أنواع إنتاج النواة واختبار النواة إضافة إلى فحص lint/الحراس للنواة؛
- تشغّل تغييرات الاختبارات الأساسية فقط فحص أنواع اختبار النواة إضافة إلى فحص lint للنواة؛
- تشغّل تغييرات إنتاج الإضافات فحص أنواع إنتاج الإضافة واختبار الإضافة إضافة إلى فحص lint للإضافة؛
- تشغّل تغييرات اختبارات الإضافات فقط فحص أنواع اختبار الإضافة إضافة إلى فحص lint للإضافة؛
- تتوسع تغييرات Plugin SDK العامة أو عقود Plugin إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود النواة هذه (تبقى عمليات مسح امتدادات Vitest عمل اختبار صريحًا)؛
- تشغّل زيادات الإصدار الخاصة ببيانات الإصدار فقط فحوصات موجّهة للإصدار/الإعدادات/اعتماديات الجذر؛
- تفشل تغييرات الجذر/الإعدادات غير المعروفة بأمان إلى كل مسارات الفحص.

يعيش توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والتابعين في مخطط الاستيراد. إعداد تسليم غرف المجموعات المشتركة هو أحد الخرائط الصريحة: تمر التغييرات في إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مسار موجه النظام لأداة الرسائل عبر اختبارات الرد الأساسية إضافة إلى انحدارات تسليم Discord وSlack بحيث يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا على مستوى عدة الاختبار بما يكفي لأن المجموعة الرخيصة المعينة ليست بديلًا موثوقًا.

## التحقق عبر Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا دافئًا لإثبات واسع. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وجهّز صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المتعمد، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا يبقى في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

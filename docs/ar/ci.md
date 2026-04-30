---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تصحح أخطاء فحص فاشل في GitHub Actions
    - أنت تنسّق تشغيل عملية التحقق من صحة الإصدار أو إعادة تشغيلها
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-04-30T18:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

تشغّل منظومة CI الخاصة بـ OpenClaw عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفرق وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات التشغيل اليدوية عبر `workflow_dispatch` النطاق الذكي عمدًا وتوسّع التنفيذ إلى الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدار فقط في سير عمل [`Plugin Prerelease`](#plugin-prerelease) المنفصل، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة                              | الغرض                                                                                      | متى تعمل                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، وPluginات المتغيرة، وبناء بيان CI      | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                        | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج من دون تبعيات مقابل تحذيرات npm                             | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                | دائمًا عند الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمريرة Knip للإنتاج الخاصة بالتبعيات فقط، إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                    | تغييرات ذات صلة بـ Node              |
| `build-artifacts`                | بناء `dist/`، وواجهة Control UI، وفحوصات القطع المبنية، والقطع القابلة لإعادة الاستخدام لاحقًا          | تغييرات ذات صلة بـ Node              |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات الحزم المضمّنة/عقد Plugin/البروتوكول                 | تغييرات ذات صلة بـ Node              |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى شظايا مع نتيجة تحقق تجميعية مستقرة                         | تغييرات ذات صلة بـ Node              |
| `checks-node-core-test`          | شظايا اختبارات Node الأساسية، باستثناء مسارات القنوات والحزم المضمّنة والعقود وPluginات             | تغييرات ذات صلة بـ Node              |
| `check`                          | مكافئ البوابة المحلية الرئيسية المقسمة إلى شظايا: أنواع الإنتاج، واللنت، والحراس، وأنواع الاختبارات، واختبار دخان صارم   | تغييرات ذات صلة بـ Node              |
| `check-additional`               | شظايا البنية المعمارية، والحدود، وحراس سطح Plugin، وحدود الحزم، ومراقبة Gateway | تغييرات ذات صلة بـ Node              |
| `build-smoke`                    | اختبارات دخان CLI المبني واختبار دخان ذاكرة بدء التشغيل                                               | تغييرات ذات صلة بـ Node              |
| `checks`                         | متحقق لاختبارات قناة القطع المبنية                                                    | تغييرات ذات صلة بـ Node              |
| `checks-node-compat-node22`      | مسار بناء ودخان للتوافق مع Node 22                                                   | تشغيل CI يدوي للإصدارات    |
| `check-docs`                     | فحوصات تنسيق التوثيق واللنت والروابط المعطلة                                                | عند تغير التوثيق                       |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                       | تغييرات ذات صلة بـ Skills في Python      |
| `checks-windows`                 | اختبارات عمليات/مسارات خاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة         | تغييرات ذات صلة بـ Windows           |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام القطع المبنية المشتركة                                  | تغييرات ذات صلة بـ macOS             |
| `macos-swift`                    | Swift lint وبناء واختبارات لتطبيق macOS                                               | تغييرات ذات صلة بـ macOS             |
| `android`                        | اختبارات وحدة Android لكلا النكهتين إضافة إلى بناء APK تصحيحي واحد                                 | تغييرات ذات صلة بـ Android           |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                    | نجاح CI على main أو تشغيل يدوي |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام القطع الأثقل ومصفوفة المنصات.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. بعد ذلك تتوسع مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يضع GitHub علامة `cancelled` على المهام التي تجاوزها تشغيل أحدث عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضوضاء CI ما لم يكن أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الشظايا التجميعية `!cancelled() && always()` حتى تظل تبلّغ عن إخفاقات الشظايا العادية، لكنها لا تصطف في الطابور بعد أن يكون سير العمل بأكمله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي مُرقّم بإصدار (`CI-v7-*`) حتى لا يتمكن عالق من جهة GitHub في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم تشغيلات المجموعة الكاملة اليدوية `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى لنت سير العمل، لكنها لا تفرض عمليات بناء Windows أو Android أو macOS الأصلية بذاتها؛ تبقى مسارات هذه المنصات محصورة في تغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات مختارة لرُزم اختبارات أساسية رخيصة، وتعديلات ضيقة على مساعدي/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريعًا خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار قطع البناء، وتوافق Node 22، وعقود القنوات، وشظايا الأساس الكاملة، وشظايا Pluginات المضمّنة، ومصفوفات الحراس الإضافية عندما يقتصر التغيير على أسطح التوجيه أو المساعدة التي تختبرها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محصورة في مغلفات العمليات/المسارات الخاصة بـ Windows، ومساعدي npm/pnpm/UI runner، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر غير المرتبطة، وPlugin، ودخان التثبيت، وتغييرات الاختبارات فقط على مسارات Linux Node.

تُقسّم أو تُوازن أبطأ عائلات اختبارات Node حتى تبقى كل مهمة صغيرة من دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاث شظايا موزونة، وتُقرن مسارات الوحدات الأساسية الصغيرة، ويعمل الرد التلقائي كأربعة عمّال متوازنين (مع تقسيم شجرة الرد الفرعية إلى شظايا agent-runner وdispatch وcommands/state-routing)، وتُوزع تكوينات Gateway/Plugin الوكيلة عبر مهام Node الوكيلة الحالية الخاصة بالمصدر فقط بدلًا من انتظار القطع المبنية. تستخدم اختبارات المتصفح الواسعة، وQA، والوسائط، واختبارات Plugin المتنوعة تكوينات Vitest المخصصة لها بدلًا من مجمع Plugin المشترك العام. تسجل شظايا أنماط التضمين إدخالات توقيت باستخدام اسم شظية CI، حتى يستطيع `.artifacts/vitest-shard-timings.json` التمييز بين تكوين كامل وشظية مفلترة. يبقي `check-additional` عمل ترجمة/تجربة حدود الحزم معًا، ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ تشغّل شظية حارس الحدود حراسها المستقلين الصغار بالتوازي داخل مهمة واحدة. تعمل مراقبة Gateway، واختبارات القنوات، وشظية حدود دعم الأساس بالتوازي داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

تشغّل CI الخاصة بـ Android كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم تبني APK التصحيحي لنكهة Play. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ ما زال مسار اختبارات الوحدة الخاص بها يترجم النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK تصحيحي مكررة عند كل دفعة ذات صلة بـ Android.

تشغّل شظية `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمريرة Knip إنتاجية خاصة بالتبعيات فقط ومثبتة على أحدث إصدار من Knip، مع تعطيل حد العمر الأدنى لإصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم ولم يُراجع، أو يترك إدخالًا قديمًا في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية المقصودة، والمولدة، والبناء، والاختبارات الحية، وجسور الحزم التي لا يستطيع Knip حلّها ساكنًا.

## التشغيلات اليدوية

تشغّل عمليات CI اليدوية الرسم البياني نفسه للمهام مثل CI العادية، لكنها تفرض تشغيل كل مسار ذي نطاق غير Android: شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، ودخان البناء، وفحوصات التوثيق، وSkills في Python، وWindows، وmacOS، وi18n لواجهة Control UI. تشغّل عمليات CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتفعّل مظلة الإصدار الكاملة Android بتمرير `include_android=true`. تُستبعد فحوصات Plugin prerelease الساكنة، وشظية `agentic-plugins` الخاصة بالإصدار فقط، ومسح دفعات Plugin الكامل، ومسارات Docker الخاصة بـ Plugin prerelease من CI. لا تعمل حزمة Docker prerelease إلا عندما يشغّل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى المجموعة الكاملة لمرشح إصدار بواسطة دفعة أو تشغيل طلب سحب آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك الرسم البياني ضد فرع أو وسم أو SHA كامل للالتزام مع استخدام ملف سير العمل من مرجع التشغيل المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغلات

| المُشغّل                           | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، وفحوصات البروتوكول/العقد/المضمّنة السريعة، وفحوصات عقود القنوات الموزعة، وشظايا `check` باستثناء lint، وشظايا `check-additional` وتجميعاتها، ومحققات تجميع اختبارات Node، وفحوصات الوثائق، وSkills الخاصة بـ Python، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم تمهيد install-smoke Ubuntu المستضاف على GitHub بحيث يمكن لمصفوفة Blacksmith الاصطفاف أبكر |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وشظايا Plugin الأقل وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وشظايا اختبارات Linux Node، وشظايا اختبارات Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس للمعالج بما يكفي لأن 8 vCPU كلفت أكثر مما وفرت)؛ وبناءات Docker الخاصة بـ install-smoke (وقت الاصطفاف لـ 32-vCPU كلف أكثر مما وفر)                                                                                                                                                                                                                                                                                                                     |
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
```

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع من أجل "تشغيل كل شيء قبل الإصدار". يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام، ويشغّل سير العمل اليدوي `CI` بذلك الهدف، ويشغّل `Plugin Prerelease` لإثباتات Plugin/الحزمة/الثابت/Docker الخاصة بالإصدار فقط، ويشغّل `OpenClaw Release Checks` لاختبار التثبيت، وقبول الحزمة، ومجموعات مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. ويمكنه أيضًا تشغيل سير العمل اللاحق للنشر `NPM Telegram Beta E2E` عند توفير مواصفة حزمة منشورة.

يتحكم `release_profile` في اتساع النطاق الحي/المزود الممرر إلى فحوصات الإصدار:

- يحافظ `minimum` على أسرع مسارات OpenAI/النواة الحرجة للإصدار.
- يضيف `stable` مجموعة المزود/الخلفية المستقرة.
- يشغّل `full` مصفوفة المزود/الوسائط الاستشارية الواسعة.

يسجل سير العمل الجامع معرّفات تشغيل سلاسل العمل الفرعية التي شغّلها، وتعيد مهمة `Verify full validation` النهائية فحص الاستنتاجات الحالية لتشغيلات الأبناء وتلحق جداول أبطأ المهام لكل تشغيل ابن. إذا أُعيد تشغيل سير عمل فرعي وتحول إلى أخضر، فأعد تشغيل مهمة تحقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`release-checks` لكل ابن إصدار، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على سير العمل الجامع. وهذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test`، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker لمسار الإصدار الحي/E2E وشظية قبول الحزمة. هذا يبقي بايتات الحزمة متسقة عبر صناديق الإصدار ويتجنب إعادة حزم المرشح نفسه في عدة مهام فرعية.

## الشظايا الحية وE2E

يبقي ابن الإصدار الحي/E2E تغطية `pnpm test:live` الأصلية الواسعة، لكنه يشغلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلًا من مهمة تسلسلية واحدة:

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
- شظايا الصوت/الفيديو المقسمة وشظايا الموسيقى المفلترة حسب المزود

هذا يحافظ على تغطية الملفات نفسها مع جعل إخفاقات المزود الحي البطيئة أسهل في إعادة التشغيل والتشخيص. وتبقى أسماء الشظايا التجميعية `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية ذات المحاولة الواحدة.

تعمل شظايا الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقًا `ffmpeg` و`ffprobe`؛ وتتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبقِ مجموعات الاختبارات الحية المدعومة بـ Docker على مشغّلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لإطلاق اختبارات Docker المتداخلة.

تستخدم شظايا النموذج/الخلفية الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل التزام محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker الحي، وGateway، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. إذا أعادت تلك الشظايا بناء هدف Docker الكامل للمصدر بشكل مستقل، فهذا يعني أن تشغيل الإصدار مهيأ بشكل خاطئ وسيهدر وقتًا فعليًا على بناءات صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" وهو يختلف عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يتحقق `resolve_package` من `workflow_ref`، ويحل مرشح حزمة واحدًا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد أرشيف tarball، ويجهز صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلًا من حزم نسخة سير العمل. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية ذات آثار فريدة.
3. يستدعي `package_telegram` اختياريًا `NPM Telegram Beta E2E`. يعمل عندما لا يكون `telegram_mode` هو `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حله؛ ولا يزال بإمكان تشغيل Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- يقبل `source=npm` فقط `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقًا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التجريبية/المستقرة المنشورة.
- يحزم `source=ref` فرعًا أو وسمًا أو SHA كاملًا لالتزام `package_ref` موثوق. يجلب المحلّل فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من سجل فرع المستودع أو وسم إصدار، ثم يثبّت الاعتماديات في شجرة عمل منفصلة، ويحزمه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزّل `source=url` ملف `.tgz` عبر HTTPS؛ يكون `package_sha256` مطلوبًا.
- ينزّل `source=artifact` ملف `.tgz` واحدًا من `artifact_run_id` و`artifact_name`؛ يكون `package_sha256` اختياريًا، لكن ينبغي توفيره للقطع الأثرية المشتركة خارجيًا.

أبقِ `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحاضنة الموثوق الذي يشغّل الاختبار. `package_ref` هو التزام المصدر الذي يُحزّم عندما تكون القيمة `source=ref`. يتيح هذا لحاضنة الاختبار الحالية التحقق من التزامات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزمة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` بالإضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin دون اتصال كي لا يكون التحقق من الحزمة المنشورة مشروطًا بتوافر ClawHub المباشر. يعيد مسار Telegram الاختياري استخدام قطعة `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة لعمليات التشغيل المستقلة.

تستدعي فحوصات الإصدار Package Acceptance باستخدام `source=ref` و`package_ref=<release-ref>` و`workflow_ref=<release workflow ref>` و`suite_profile=custom` و`docker_lanes='bundled-channel-deps-compat plugins-offline'` و`telegram_mode=mock-openai`. تغطي أجزاء Docker لمسار الإصدار مسارات الحزمة/التحديث/Plugin المتداخلة؛ وتحافظ Package Acceptance على إثبات توافق القنوات المضمنة الأصلي للقطعة، وPlugin دون اتصال، وTelegram مقابل أرشيف الحزمة نفسه الذي تم حله. ما زالت فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة؛ ويجب أن يبدأ تحقق المنتج للحزمة/التحديث من Package Acceptance. تتحقق مسارات Windows المعبأة والمثبّت الجديد أيضًا من أن الحزمة المثبتة يمكنها استيراد تجاوز للتحكم في المتصفح من مسار Windows خام ومطلق. يعتمد اختبار الدخان لدورة وكيل OpenAI عبر أنظمة التشغيل افتراضيًا على `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطه، وإلا يستخدم `openai/gpt-5.4-mini`، بحيث يبقى إثبات التثبيت وGateway سريعًا وحتميًا.

### نوافذ التوافق القديم

تملك Package Acceptance نوافذ توافق قديم محدودة للحزم المنشورة مسبقًا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من الأرشيف؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من تجهيزة git الوهمية المشتقة من الأرشيف، وقد يسجّل غياب `update.channel` المستمر؛
- قد تقرأ اختبارات الدخان الخاصة بـ Plugin مواقع سجل تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التهيئة مع استمرار اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضًا من ملفات ختم بيانات تعريف البناء المحلي التي كانت قد شُحنت بالفعل. يجب أن تفي الحزم اللاحقة بالعقود الحديثة؛ وتفشل الشروط نفسها بدلًا من التحذير أو التخطي.

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

عند تصحيح تشغيل فاشل لقبول الحزمة، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص تشغيل الابن `docker_acceptance` وقطع Docker الأثرية الخاصة به: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار دخان التثبيت

يعيد سير العمل المنفصل `Install Smoke` استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. يقسم تغطية الدخان إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- يشغّل **المسار السريع** لطلبات السحب التي تلمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المضمنة، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمارسها مهام دخان Docker. لا تحجز تغييرات Plugin المصدرية المضمنة فقط، والتعديلات الخاصة بالاختبارات فقط، والتعديلات الخاصة بالتوثيق فقط، عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويتحقق من CLI، ويشغّل اختبار دخان CLI لحذف الوكلاء من مساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway داخل الحاوية، ويتحقق من وسيطة بناء لامتداد مضمن، ويشغّل ملف تعريف Docker المحدود لـ Plugin المضمنة ضمن مهلة أوامر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- يحتفظ **المسار الكامل** بتثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهز install-smoke أو يعيد استخدام صورة دخان Dockerfile جذرية من GHCR لهدف SHA واحد، ثم يشغّل تثبيت حزمة QR، واختبارات دخان Dockerfile/Gateway الجذرية، واختبارات دخان المثبّت/التحديث، وDocker E2E السريع لـ Plugin المضمنة كمهام منفصلة كي لا ينتظر عمل المثبّت خلف اختبارات دخان الصورة الجذرية.

لا تفرض دفعات `main` (بما في ذلك التزامات الدمج) المسار الكامل؛ عندما يطلب منطق النطاق المتغير تغطية كاملة عند دفعة، يحتفظ سير العمل بدخان Docker السريع ويترك دخان التثبيت الكامل للتحقق الليلي أو تحقق الإصدار.

يُحاط اختبار دخان موفر الصور لتثبيت Bun العام البطيء بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات تشغيل `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يبني `pnpm test:docker:all` مسبقًا صورة اختبار مباشر مشتركة واحدة، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبّت الأرشيف نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### المعاملات القابلة للضبط

| المتغير                                | الافتراضي | الغرض                                                                                         |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | عدد خانات التجمع الرئيسي للمسارات العادية.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | عدد خانات تجمع الذيل الحساس للموفر.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | حد المسارات المباشرة المتزامنة كي لا يقيّد الموفرون المعدل.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | حد مسارات تثبيت npm المتزامنة.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | حد مسارات الخدمات المتعددة المتزامنة.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | تباعد بين بدايات المسارات لتجنب عواصف إنشاء عفريت Docker؛ اضبط `0` لعدم التباعد.              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات مباشرة/ذيلية محددة حدودًا أضيق.             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير مضبوط | يطبع `1` خطة المجدول دون تشغيل المسارات.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير مضبوط | قائمة دقيقة مفصولة بفواصل للمسارات؛ تتخطى دخان التنظيف كي يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من سقفه الفعّال أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تنفذ التجميعة المحلية فحوصات مسبقة لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولًا، وتتوقف افتراضيًا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل مباشر/E2E قابل لإعادة الاستخدام

يسأل سير العمل المباشر/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة المباشرة والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحول `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل قطعة حزمة من التشغيل الحالي، أو ينزّل قطعة حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون الأرشيف؛ ويبني ويدفع صور Docker E2E المجردة/الوظيفية الموسومة بملخص الحزمة إلى GHCR من خلال ذاكرة التخزين المؤقت لطبقات Docker في Blacksmith عندما تحتاج الخطة إلى مسارات بحزمة مثبتة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. تعاد محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة، بحيث تعاد محاولة دفق سجل/ذاكرة تخزين مؤقت عالق بسرعة بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار كمهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بحيث يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

مقاطع Docker للإصدار الحالي هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h` و`bundled-channels-core` و`bundled-channels-update-a` و`bundled-channels-update-discord` و`bundled-channels-update-b` و`bundled-channels-contracts`. يظل المقطع التجميعي `bundled-channels` متاحًا لإعادة التشغيل اليدوية لمرة واحدة، وتظل `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يظل الاسم المستعار للمسار `install-e2e` هو الاسم المستعار التجميعي لإعادة التشغيل اليدوية لكلا مساري مثبّت المزوّدين. يشغّل المقطع `bundled-channels` مسارات `bundled-channel-*` و`bundled-channel-update-*` المقسّمة بدلًا من المسار التسلسلي الشامل `bundled-channel-deps`.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكامل ذلك، ويحتفظ بمقطع مستقل `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل مقطع `.artifacts/docker-tests/` متضمنًا سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وملف JSON لخطة المجدول، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل إدخال سير العمل `docker_lanes` المسارات المحددة مقابل الصور المحضّرة بدلًا من وظائف المقاطع، مما يبقي تصحيح أخطاء المسارات الفاشلة محدودًا في وظيفة Docker واحدة مستهدفة، ويحضّر أثر الحزمة أو ينزّله أو يعيد استخدامه لذلك التشغيل؛ إذا كان المسار المحدد مسار Docker حيًا، تبني الوظيفة المستهدفة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر GitHub المولّدة لإعادة التشغيل لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضّرة عند وجود تلك القيم، بحيث يستطيع المسار الفاشل إعادة استخدام الحزمة والصور نفسها من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير عمل live/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي للـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو سير عمل منفصل يُطلقه `Full Release Validation` أو مشغّل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات إرسال CI اليدوية المستقلة، هذه المجموعة معطلة. يوازن اختبارات الـ Plugin المضمّنة عبر ثمانية عمال امتدادات؛ وتشغّل وظائف شظايا الامتدادات هذه ما يصل إلى مجموعتي إعداد Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وحجم ذاكرة Node أكبر حتى لا تنشئ دفعات Plugin الثقيلة في الاستيراد وظائف CI إضافية.

## مختبر ضمان الجودة

لدى مختبر ضمان الجودة مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي.

- يعمل سير العمل `Parity gate` عند تغييرات PR المطابقة وعند الإرسال اليدوي؛ فهو يبني وقت تشغيل ضمان الجودة الخاص ويقارن حزم الوكلاء الوهمية GPT-5.5 وOpus 4.6.
- يعمل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند الإرسال اليدوي؛ ويفرّع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كوظائف متوازية. تستخدم الوظائف الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مساري النقل الحيين Matrix وTelegram باستخدام المزوّد الوهمي الحتمي والنماذج المؤهلة للوهم (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يكون عقد القناة معزولًا عن زمن استجابة النموذج الحي وبدء تشغيل Plugin المزوّد العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن تكافؤ ضمان الجودة يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النماذج الحية والمزوّدات الأصلية ومزوّدات Docker المنفصلة اتصال المزوّد.

يستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعم CLI المستخرج ذلك. يظل الافتراضي في CLI وإدخال سير العمل اليدوي `all`؛ وتؤدي عملية إرسال `matrix_profile=all` اليدوية دائمًا إلى تقسيم تغطية Matrix الكاملة إلى وظائف `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات مختبر ضمان الجودة الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ ضمان الجودة الخاصة به حزم المرشح والأساس كوظائف مسارات متوازية، ثم تنزّل كلا الأثرين إلى وظيفة تقرير صغيرة للمقارنة النهائية للتكافؤ.

لا تضع مسار دمج PR خلف `Parity gate` إلا إذا كان التغيير يمس فعليًا وقت تشغيل ضمان الجودة، أو تكافؤ حزم النماذج، أو سطحًا يملكه سير عمل التكافؤ. بالنسبة لإصلاحات القنوات أو الإعدادات أو الوثائق أو اختبارات الوحدة العادية، تعامل معه كإشارة اختيارية واتبع أدلة CI/الفحوصات ذات النطاق المحدد بدلًا من ذلك.

## CodeQL

سير عمل `CodeQL` هو عمدًا ماسح أمان أولي ضيق النطاق، وليس مسحًا كاملًا للمستودع. تقوم عمليات الحراسة اليومية واليدوية وطلبات السحب غير المسودة بفحص كود سير عمل Actions إضافة إلى أعلى أسطح JavaScript/TypeScript خطورةً باستخدام استعلامات أمان عالية الثقة مرشحة إلى `security-severity` عالية/حرجة.

تظل حراسة طلب السحب خفيفة: فهي تبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، وتشغّل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى Android وmacOS CodeQL خارج افتراضيات PR.

### فئات الأمان

| الفئة                                            | السطح                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة والأسرار وبيئة العزل وCron وخط أساس Gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية إضافة إلى وقت تشغيل Plugin القنوات وGateway وPlugin SDK والأسرار ونقاط تدقيق المراجعة                 |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية وتحليل IP وحارس الشبكة وweb-fetch وسياسة SSRF في Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP ومساعدات تنفيذ العمليات والتسليم الصادر وبوابات تنفيذ أدوات الوكيل                                              |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح ثقة تثبيت Plugin والمحمّل والبيان والسجل وتجهيز تبعيات وقت التشغيل وتحميل المصادر وعقد حزمة Plugin SDK |

### شظايا الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويًا من أجل CodeQL على أصغر مشغّل Blacksmith Linux يقبله فحص سلامة سير العمل. ترفع ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويًا من أجل CodeQL على Blacksmith macOS، وتصفّي نتائج بناء التبعيات من SARIF المرفوع، وترفع ضمن `/codeql-critical-security/macos`. تُبقى خارج الافتراضيات اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفًا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المقابلة. تشغّل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية ذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغّل Blacksmith Linux الأصغر. حراسة طلب السحب الخاصة بها أصغر عمدًا من ملف التعريف المجدول: لا تشغّل طلبات السحب غير المسودة إلا شظايا `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/العزل/الأمان، ووقت تشغيل القنوات الأساسية وPlugin القنوات المضمّنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/ربط SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزوّد/كتالوج النماذج، وتشخيصات الجلسة/صفوف التسليم، ومحمّل Plugin، وعقد حزمة Plugin SDK، أو تغييرات وقت تشغيل رد Plugin SDK. تشغّل تغييرات إعداد CodeQL وسير عمل الجودة جميع شظايا جودة PR الاثنتي عشرة.

يقبل الإرسال اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليم/تكرار لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | المصادقة، والأسرار، وبيئة العزل، وCron، وكود حدود أمان Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | مخطط الإعدادات، والترحيل، والتطبيع، وعقود الإدخال/الإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود أساليب الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القنوات الأساسية وPlugin القناة المضمّنة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | تنفيذ الأوامر، وتوجيه النموذج/المزوّد، وتوجيه الرد التلقائي والطوابير، وعقود وقت تشغيل مستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، ووصلة تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | تفاصيل طابور الرد الداخلية، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI لطبيب الجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توجيه الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القناة، وطوابير التسليم، ومساعدات ربط الجلسات/الخيوط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/كتالوجات المزوّد، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى تحكم المهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المُحمّل، والسجل، والسطح العام، ونقطة دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان بحيث يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون إخفاء إشارة الأمان. يجب إعادة إضافة توسعة CodeQL الخاصة بـ Swift وPython وPlugin المضمّنة كعمل متابعة محدود النطاق أو مجزأ فقط بعد أن تستقر الملفات الشخصية الضيقة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت مؤخرًا. ليس له جدول صرف: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يفعّله، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات تشغيل سير العمل عندما يكون `main` قد تقدّم أو عندما يكون تشغيل آخر غير متخطى لـ Docs Agent قد أُنشئ في الساعة الأخيرة. عند تشغيله، يراجع نطاق الالتزام من SHA مصدر Docs Agent السابق غير المتخطى إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. ليس له جدول صرف: يمكن لتشغيل CI ناجح من دفع غير آلي على `main` أن يفعّله، لكنه يتخطى إذا كان استدعاء تشغيل سير عمل آخر قد عمل بالفعل أو يعمل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية تلك. يبني المسار تقرير أداء Vitest مجمّعًا للمجموعة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلًا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير المجموعة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان في خط الأساس اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير المجموعة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفع الروبوت، يعيد المسار إسناد التصحيح المتحقق منه، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي التصحيحات القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضع أمان إسقاط sudo نفسه مثل وكيل المستندات.

### طلبات PR المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. يستخدم افتراضيًا التشغيل الجاف ولا يغلق إلا طلبات PR المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب PR الذي وصل مدمج وأن كل تكرار لديه إما مشكلة مرجعية مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلي وتوجيه التغييرات

توجد منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وتُنفذ بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلي هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغّل فحص أنواع إنتاج الأساس واختباراته بالإضافة إلى فحص الأنماط/الحراس الأساسية؛
- تغييرات الاختبارات الأساسية فقط تشغّل فقط فحص أنواع الاختبارات الأساسية بالإضافة إلى فحص الأنماط الأساسي؛
- تغييرات إنتاج الإضافة تشغّل فحص أنواع إنتاج الإضافة واختباراتها بالإضافة إلى فحص أنماط الإضافة؛
- تغييرات اختبارات الإضافة فقط تشغّل فحص أنواع اختبارات الإضافة بالإضافة إلى فحص أنماط الإضافة؛
- تغييرات Plugin SDK العامة أو عقد Plugin تتوسع إلى فحص أنواع الإضافات لأن الإضافات تعتمد على تلك العقود الأساسية (تبقى عمليات مسح إضافات Vitest عمل اختبار صريحًا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط تشغّل فحوصات مستهدفة للإصدار/الإعدادات/اعتماديات الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى جميع مسارات الفحص.

يوجد توجيه الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهو أرخص عمدًا من `check:changed`: تعديلات الاختبارات المباشرة تشغّل نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم الاختبارات الشقيقة والمعتمدين عبر مخطط الاستيراد. إعداد تسليم غرفة المجموعة المشتركة أحد الخرائط الصريحة: تغييرات إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو موجّه النظام لأداة الرسائل تمر عبر اختبارات الرد الأساسية بالإضافة إلى انحدارات تسليم Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعًا على مستوى الحاضنة بما يكفي بحيث لا تكون المجموعة الرخيصة المرسومة وكيلًا موثوقًا.

## تحقق Testbox

شغّل Testbox من جذر المستودع وفضّل صندوقًا جديدًا مُسخّنًا لإثبات واسع. قبل صرف بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متتبّع. يعني ذلك عادة أن حالة المزامنة البعيدة ليست نسخة موثوقة من طلب PR؛ أوقف ذلك الصندوق وسخّن صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. لطلبات PR ذات الحذف الكبير المتعمّد، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لذلك تشغيل السلامة.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا يبقى في مرحلة المزامنة لأكثر من خمس دقائق دون إخراج بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل ذلك الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروق المحلية الكبيرة على نحو غير معتاد.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

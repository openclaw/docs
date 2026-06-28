---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-06-28T00:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (الحِزم، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من التحديثات وحزم Plugin: [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

- ترتيب الاختبارات المحلية الروتيني:
  1. `pnpm test:changed` لإثبات Vitest ضمن نطاق التغييرات.
  2. `pnpm test <path-or-filter>` لملف واحد أو دليل أو هدف صريح.
  3. `pnpm test` فقط عندما تحتاج عمدا إلى مجموعة Vitest المحلية الكاملة.
- `pnpm test:force`: ينهي أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتعارض اختبارات الخادم مع مثيل قيد التشغيل. استخدمه عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولا.
- `pnpm test:coverage`: يشغل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية لمسار الوحدة الافتراضي، وليست تغطية لكل الملفات في المستودع كله. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. لأن `coverage.all` تساوي false ولأن نطاق مسار الوحدة الافتراضي يحدد ملفات التغطية لتشمل اختبارات الوحدة غير السريعة ذات ملفات المصدر الشقيقة، تقيس البوابة المصدر المملوك لهذا المسار بدلا من كل استيراد انتقالي يصادف تحميله.
- `pnpm test:coverage:changed`: يشغل تغطية الوحدة فقط للملفات المتغيرة منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار تغييرات ذكي ورخيص. يشغل أهدافا دقيقة من تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق الواسع/الإعدادات/الحزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل صريح واسع لاختبارات التغييرات. استخدمه عندما ينبغي لتعديل في حاضنة الاختبارات/الإعدادات/الحزمة أن يرجع إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يفوض إلى Crabbox/Testbox افتراضيا خارج CI، ثم يشغل بوابة الفحص الذكي للتغييرات للفرق مقابل `origin/main` داخل الابن البعيد. يشغل أوامر فحص الأنواع والLint والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- أشجار عمل Codex وعمليات السحب المرتبطة/المتناثرة: تجنب `pnpm test*` و`pnpm check*` و`pnpm crabbox:run` المحلية المباشرة ما لم تتحقق من أن pnpm لن يعيد تسوية الاعتماديات. لإثبات ملف صريح صغير استخدم `node scripts/run-vitest.mjs <path-or-filter>`؛ ولبوابات التغييرات أو الإثبات الواسع استخدم `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` حتى يعمل pnpm داخل Testbox.
- إثبات Testbox عبر Crabbox: استخدم `exitCode` النهائي من الغلاف وJSON التوقيت كنتيجة الأمر. قد يظهر تشغيل Blacksmith GitHub Actions المفوض بالحالة `cancelled` بعد أمر SSH ناجح لأن Testbox يوقف من خارج إجراء keepalive؛ تحقق من ملخص الغلاف ومخرجات الأمر قبل اعتبار ذلك فشل اختبار.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: يبقي تسلسل الفحوصات الثقيلة داخل شجرة العمل الحالية بدلا من دليل Git المشترك لأوامر مثل `pnpm check:changed` و`pnpm test ...` المستهدفة. استخدمه فقط على المضيفات المحلية عالية السعة عندما تشغل عمدا فحوصات مستقلة عبر أشجار عمل مرتبطة.
- `pnpm test`: يمرر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. التشغيلات غير المستهدفة هي إثبات للمجموعة الكاملة: تستخدم مجموعات شظايا ثابتة، وتتوسع إلى إعدادات طرفية للتنفيذ المحلي المتوازي، وتطبع تفرع الشظايا المحلي المتوقع قبل البدء. تتوسع مجموعة الامتدادات دائما إلى إعدادات الشظايا لكل امتداد بدلا من عملية مشروع جذر واحدة ضخمة.
- تنتهي تشغيلات غلاف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه تفصيلا لكل شظية.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو مثبت إعدادات، أو مساحة عمل، أو دليل وكيل، أو مخزن ملف تعريف مصادقة.
- `pnpm test:env-mutations:report`: تقرير غير حاجب عن الاختبارات والحاضنات التي تعدل `HOME`، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو `OPENCLAW_WORKSPACE_DIR`، أو مفاتيح بيئة OpenClaw ذات الصلة مباشرة. استخدمه للعثور على مرشحين للترحيل إلى مساعد حالة الاختبار المشتركة.
- E2E بواجهة التحكم الوهمية: استخدم `pnpm test:ui:e2e` لمسار Vitest + Playwright الذي يبدأ واجهة تحكم Vite ويقود صفحة Chromium حقيقية مقابل Gateway WebSocket وهمي. توجد الاختبارات في `ui/src/**/*.e2e.test.ts`؛ وتوجد المحاكيات وعناصر التحكم المشتركة في `ui/src/test-helpers/control-ui-e2e.ts`. يتضمن `pnpm test:e2e` هذا المسار. في أشجار عمل Codex، فضّل `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` لإثبات مستهدف صغير بعد تثبيت الاعتماديات، أو Testbox/Crabbox لإثبات واجهة رسومية أوسع.
- مساعدو E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط السجلات، والتنظيف في مكان واحد.
- اختبارات TUI PTY: استخدم `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` لمسار PTY السريع ذي الخلفية الوهمية. استخدم `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` أو `pnpm tui:pty:test:watch --mode local` للدخان الأبطأ `tui --local`، الذي يحاكي فقط نقطة نهاية النموذج الخارجية. تحقق من نص مرئي ثابت أو نداءات مثبتة، وليس لقطات ANSI الخام.
- مساعدو Docker/Bash E2E: يمكن للمسارات التي تستدعي `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفكه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للنداءات ذات المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستدعاء كمصدر. تحافظ `--` قبل `create` على منع إصدارات Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استدعاء `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدث تشغيلات الشظايا الكاملة وشظايا الامتدادات وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ تستخدم التشغيلات اللاحقة لكل الإعدادات هذه التوقيتات لموازنة الشظايا البطيئة والسريعة. تضيف شظايا CI بنمط التضمين اسم الشظية إلى مفتاح التوقيت، مما يبقي توقيتات الشظايا المفلترة مرئية دون استبدال بيانات توقيت كل الإعدادات. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أداة التوقيت المحلية.
- تمرر ملفات اختبار `plugin-sdk` و`commands` المحددة الآن عبر مسارات خفيفة مخصصة تبقي فقط `test/setup.ts`، وتترك الحالات الثقيلة وقت التشغيل على مساراتها الموجودة.
- ملفات المصدر ذات الاختبارات الشقيقة تعيّن إلى ذلك الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تستخدم تعديلات المساعدين تحت `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` مخطط استيراد محليا لتشغيل الاختبارات المستوردة بدلا من تشغيل كل شظية على نطاق واسع عندما يكون مسار الاعتمادية دقيقا.
- ينقسم `auto-reply` الآن أيضا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن حاضنة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- أصبحت إعدادات Vitest الأساسية تفترض الآن `pool: "threads"` و`isolate: false`، مع تفعيل المشغل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغلان كل شظايا الامتدادات/Plugins. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ وتبقى مجموعات Plugins الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مرفق واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات محددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: تنميط الاستيراد نفسه، لكن فقط للملفات المتغيرة منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس مسار نمط التغييرات الموجه مقابل تشغيل مشروع الجذر الأصلي لنفس فرق Git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغل كل إعداد طرفي لمجموعة Vitest الكاملة تسلسليا ويكتب بيانات مدة مجمعة إضافة إلى أدوات JSON/سجل لكل إعداد. يستخدم وكيل أداء الاختبارات هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- `pnpm test:docker:timings <summary.json>` يفحص مسارات Docker البطيئة بعد تشغيل Docker شامل؛ استخدم `pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة من الأدوات نفسها.
- تكامل Gateway: الاشتراك اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغل تجميعة E2E للمستودع: اختبارات دخان Gateway من الطرف إلى الطرف إضافة إلى مسار E2E للمتصفح الوهمي في واجهة التحكم.
- `pnpm test:e2e:gateway`: يشغل اختبارات دخان Gateway من الطرف إلى الطرف (إقران متعدد المثيلات WS/HTTP/node). يفترض افتراضيا `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات المفصلة.
- `pnpm test:live`: يشغل اختبارات المزودين الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزود) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغل Node/Git عارية إضافة إلى صورة وظيفية تثبت تلك الحزمة في `/app`، ثم يشغّل مسارات فحص Docker smoke باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتماديات Plugin؛ وتثبت تلك المسارات حزمة tarball المبنية مسبقًا بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. يُعد `scripts/package-openclaw-for-docker.mjs` محزّم الحزمة الوحيد محليًا وفي CI، ويتحقق من حزمة tarball إضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكها Docker. توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويوجد منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوصات بيانات الاعتماد من دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وتكون قيمته الافتراضية 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجمع الذيل الحساس للمزوّد وتكون قيمته الافتراضية 10. القيم الافتراضية لحدود المسارات الثقيلة هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ والقيم الافتراضية لحدود المزوّدين هي مسار ثقيل واحد لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن الفعلي أو حد المورد على مضيف منخفض التوازي، فيمكنه مع ذلك البدء من مجمع فارغ وسيعمل وحده حتى يحرر السعة. تُباعد بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف إنشاء عفريت Docker المحلي؛ ويمكن التجاوز باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغل فحوصات تمهيدية لـ Docker افتراضيًا، وينظف حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI للمزوّدين بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحيين العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات من دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط مخرجات الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحيين فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط المسارات الحية الرئيسية ومسارات الذيل الحية في مجمع واحد مرتب من الأطول أولًا بحيث يمكن لدلاء المزوّدين حزم أعمال Claude وCodex وGemini معًا. يتوقف المشغل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدودًا أضيق لكل مسار. لأوامر إعداد Docker لواجهة CLI الخلفية مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل رخيصة وموجهة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E للمصدر مدعومة بـ Chromium، ويبدأ CDP خامًا إضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطارات.
- `pnpm test:docker:skill-install`: يثبت حزمة OpenClaw tarball المحزمة في مشغل Docker عارٍ، ويعطل `skills.install.allowUploadedArchives`، ويحل slug مهارة حاليًا من بحث ClawHub الحي، ويثبتها عبر `openclaw skills install`، ويتحقق من `SKILL.md`، و`.clawhub/origin.json`، و`.clawhub/lock.json`، و`skills info --json`.
- يمكن تشغيل مجسات Docker الحية لواجهة CLI الخلفية كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:claude`، أو `pnpm test:docker:live-cli-backend:claude:resume`، أو `pnpm test:docker:live-cli-backend:claude:mcp`. لدى Gemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw وOpen WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر وكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حيًا صالحًا للاستخدام، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات اختبارات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءة النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تحقق إشعار Claude إطارات MCP الخام عبر stdio مباشرة بحيث يعكس فحص smoke ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبت حزمة OpenClaw tarball المحزمة فوق fixture لمستخدم قديم متسخ، ويشغّل تحديث الحزمة إضافة إلى doctor غير تفاعلي من دون مفاتيح مزوّد حي أو قناة، ثم يبدأ Gateway عبر local loopback ويتحقق من بقاء الوكلاء، وتكوين القناة، وقوائم السماح للـ Plugin، وملفات مساحة العمل/الجلسة، وحالة اعتماديات Plugin القديمة البالية، وبدء التشغيل، وحالة RPC.
- `pnpm test:docker:published-upgrade-survivor`: يثبت `openclaw@latest` افتراضيًا، ويزرع ملفات واقعية لمستخدم موجود من دون مفاتيح مزوّد حي أو قناة، ويكوّن ذلك الأساس باستخدام وصفة أوامر `openclaw config set` مدمجة، ويحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw tarball المحزمة، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويتحقق من أن النوايا المكوّنة، وملفات مساحة العمل/الجلسة، وتكوين Plugin البالي وحالة الاعتماديات القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC تبقى أو تُصلح بنظافة. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، أو أضف fixtures للسيناريوهات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة المشكلات المبلغ عنها `configured-plugin-installs` للتحقق من أن إضافات OpenClaw الخارجية المكوّنة تُثبت تلقائيًا أثناء الترقية و`stale-source-plugin-shadow` لمنع ظلال Plugin المتاحة في المصدر فقط من كسر بدء التشغيل. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`، ويحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23` قبل تمرير مواصفات الحزم الدقيقة إلى مسارات Docker.
- `pnpm test:docker:update-migration`: يشغّل حزمة survivor للترقية المنشورة في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح وتثبت تنظيف اعتماديات Plugin المكوّنة خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل فحص smoke للتثبيت/التحديث لمسار محلي، و`file:`، وحزم سجل npm مع اعتماديات مرفوعة، ومراجع git متحركة، وfixtures ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات إدراج/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. بالنسبة إلى المضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات البيئة الاختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: "رُد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي."

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- وسيط minimax‏ 1279ms (الأدنى 1114، الأعلى 2431)
- وسيط opus‏ 2454ms (الأدنى 1224، الأعلى 3170)

## قياس بدء تشغيل CLI

السكربت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

الاستخدام:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

الإعدادات المسبقة:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات أقصى RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل، بحيث يستخدم قياس التوقيت والتقاط ملف التعريف حزمة الاختبار نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر اختبار smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر الحزمة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف أساس fixture المضمّن في المستودع عند `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المضمّن:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بملف fixture باستخدام `pnpm test:startup:bench:check`

## قياس بدء تشغيل Gateway

السكربت: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

يعتمد الاختبار افتراضيًا على مدخل CLI المبني في `dist/entry.js`؛ شغّل
`pnpm build` قبل استخدام أوامر سكربت الحزمة. لقياس مشغّل المصدر
بدلًا من ذلك، مرّر `--entry scripts/run-node.mjs` وأبقِ تلك النتائج
منفصلة عن خطوط الأساس الخاصة بالمدخل المبني.

الاستخدام:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

معرّفات الحالات:

- `default`: بدء تشغيل Gateway عادي.
- `skipChannels`: بدء تشغيل Gateway مع تخطي بدء تشغيل القنوات.
- `oneInternalHook`: خطاف داخلي واحد مُهيّأ.
- `allInternalHooks`: جميع الخطافات الداخلية.
- `fiftyPlugins`: 50 Plugin ببيانات manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin ببيانات manifest وتحميل كسول عند بدء التشغيل.

يتضمن الإخراج أول خرج للعملية، و`/healthz`، و`/readyz`، ووقت سجل الاستماع عبر HTTP،
ووقت سجل جاهزية Gateway، ووقت CPU، ونسبة نواة CPU، وأقصى RSS، والذاكرة heap، ومقاييس تتبع بدء التشغيل،
وتأخير حلقة الأحداث، ومقاييس تفصيلية لجدول بحث Plugin. يفعّل السكربت
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` في بيئة Gateway التابعة.

اقرأ `/healthz` بوصفه مؤشر حياة: يمكن لخادم HTTP أن يجيب. واقرأ `/readyz` بوصفه
جاهزية قابلة للاستخدام: فقد استقرت العمليات الجانبية الخاصة بـ Plugin عند بدء التشغيل، والقنوات، وأعمال ما بعد الإرفاق الحرجة للجاهزية.
تُرسل خطافات بدء تشغيل Gateway
بشكل غير متزامن ولا تُعد جزءًا من ضمان الجاهزية. وقت سجل الجاهزية هو
الطابع الزمني الداخلي لسجل جاهزية Gateway؛ وهو مفيد للإسناد من جهة العملية
لكنه ليس بديلًا عن فحص `/readyz` الخارجي.

استخدم إخراج JSON أو `--output` عند مقارنة التغييرات. استخدم `--cpu-prof-dir` فقط
بعد أن يشير إخراج التتبع إلى استيراد أو ترجمة أو عمل مقيّد بـ CPU لا يمكن
تفسيره من توقيتات المراحل وحدها. لا تقارن نتائج مشغّل المصدر بنتائج
`dist/entry.js` المبنية على أنها خط الأساس نفسه.

## قياس إعادة تشغيل Gateway

السكربت: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

قياس إعادة التشغيل مدعوم على macOS وLinux فقط. يستخدم SIGUSR1 لإعادة التشغيل
داخل العملية ويفشل فورًا على Windows.

يعتمد الاختبار افتراضيًا على مدخل CLI المبني في `dist/entry.js`؛ شغّل
`pnpm build` قبل استخدام أوامر سكربت الحزمة. لقياس مشغّل المصدر
بدلًا من ذلك، مرّر `--entry scripts/run-node.mjs` وأبقِ تلك النتائج
منفصلة عن خطوط الأساس الخاصة بالمدخل المبني.

الاستخدام:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

معرّفات الحالات:

- `skipChannels`: إعادة التشغيل مع تخطي القنوات.
- `skipChannelsAcpxProbe`: إعادة التشغيل مع تخطي القنوات وتفعيل فحص بدء تشغيل ACPX.
- `skipChannelsNoAcpxProbe`: إعادة التشغيل مع تخطي القنوات وتعطيل فحص بدء تشغيل ACPX.
- `default`: إعادة تشغيل عادية.
- `fiftyPlugins`: إعادة التشغيل مع 50 Plugin ببيانات manifest.

يتضمن الإخراج `/healthz` التالي، و`/readyz` التالي، ومدة التوقف، وتوقيت جاهزية إعادة التشغيل،
وCPU، وRSS، ومقاييس تتبع بدء التشغيل للعملية البديلة، ومقاييس تتبع إعادة التشغيل
لمعالجة الإشارة، وتصريف العمل النشط، ومراحل الإغلاق، والبدء التالي، وتوقيت الجاهزية،
ولقطات الذاكرة. يفعّل السكربت
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` و`OPENCLAW_GATEWAY_RESTART_TRACE=1` في
بيئة Gateway التابعة.

استخدم هذا القياس عندما يلمس تغيير ما إشارات إعادة التشغيل، أو معالجات الإغلاق،
أو بدء التشغيل بعد إعادة التشغيل، أو إيقاف العمليات الجانبية، أو تسليم الخدمة، أو الجاهزية بعد
إعادة التشغيل. ابدأ بـ `skipChannels` عند عزل آليات Gateway عن بدء تشغيل القنوات.
استخدم `default` أو الحالات الثقيلة بـ Plugin فقط بعد أن تشرح الحالة الضيقة
مسار إعادة التشغيل.

مقاييس التتبع مؤشرات إسناد، وليست أحكامًا. ينبغي الحكم على تغيير إعادة التشغيل
من خلال عينات متعددة، ونطاق المالك المطابق، وسلوك `/healthz` و`/readyz`،
وعقد إعادة التشغيل المرئي للمستخدم.

## اختبار الإعداد الشامل E2E (Docker)

Docker اختياري؛ هذا مطلوب فقط لاختبارات smoke الخاصة بالإعداد داخل الحاويات.

تدفق بدء كامل بارد داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR (Docker)

يتأكد من أن مساعد تشغيل QR المُصان يُحمّل ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

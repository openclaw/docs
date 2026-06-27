---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع الفرض والتغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-06-27T18:34:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (مجموعات الاختبار، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من صحة التحديثات وحزمة Plugin: [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

- ترتيب الاختبارات المحلية الروتيني:
  1. `pnpm test:changed` لإثبات Vitest ضمن نطاق التغييرات.
  2. `pnpm test <path-or-filter>` لملف واحد أو دليل أو هدف صريح.
  3. `pnpm test` فقط عندما تحتاج عمدا إلى مجموعة Vitest المحلية الكاملة.
- `pnpm test:force`: ينهي أي عملية gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغل مجموعة Vitest الكاملة بمنفذ gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدمه عندما يترك تشغيل gateway سابق المنفذ 18789 مشغولا.
- `pnpm test:coverage`: يشغل مجموعة الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية لمسار الوحدات الافتراضي، وليست تغطية لكل ملفات المستودع بالكامل. العتبات هي 70% للأسطر/الدوال/العبارات و55% للفروع. لأن `coverage.all` يساوي false ولأن المسار الافتراضي يحصر تضمينات التغطية في اختبارات الوحدات غير السريعة ذات ملفات المصدر الشقيقة، تقيس البوابة المصدر المملوك لهذا المسار بدلا من كل استيراد عابر يصادف تحميله.
- `pnpm test:coverage:changed`: يشغل تغطية الوحدات فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار تغييرات ذكي ورخيص. يشغل أهدافا دقيقة من تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ورسم الاستيراد المحلي. يتم تخطي تغييرات واسعة/إعدادات/حزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات واسع صريح. استخدمه عندما يجب أن يعود تعديل حزمة/إعداد/عدة اختبار إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يفوض إلى Crabbox/Testbox افتراضيا خارج CI، ثم يشغل بوابة الفحص الذكي للتغييرات للفرق مقابل `origin/main` داخل الابن البعيد. يشغل فحص الأنواع، والفحص البرمجي، وأوامر الحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` صريحا لإثبات الاختبار.
- أشجار عمل Codex وعمليات checkout المرتبطة/المتناثرة: تجنب `pnpm test*` و`pnpm check*` و`pnpm crabbox:run` المحلية المباشرة إلا إذا تحققت من أن pnpm لن يوفق الاعتماديات. لإثبات ملف صريح صغير استخدم `node scripts/run-vitest.mjs <path-or-filter>`؛ ولبوابات التغييرات أو الإثبات الواسع استخدم `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` حتى يعمل pnpm داخل Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: يبقي تسلسل الفحص الثقيل داخل شجرة العمل الحالية بدلا من دليل Git المشترك لأوامر مثل `pnpm check:changed` و`pnpm test ...` الموجه. استخدمه فقط على المضيفات المحلية عالية السعة عندما تشغل عمدا فحوصا مستقلة عبر أشجار عمل مرتبطة.
- `pnpm test`: يمرر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. التشغيلات غير الموجهة هي إثبات للمجموعة الكاملة: تستخدم مجموعات شظايا ثابتة، وتتوسع إلى إعدادات ورقية للتنفيذ المتوازي المحلي، وتطبع توزيع الشظايا المحلي المتوقع قبل البدء. تتوسع مجموعة الإضافات دائما إلى إعدادات الشظايا لكل إضافة بدلا من عملية مشروع جذرية عملاقة واحدة.
- تنتهي تشغيلات غلاف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه كتفصيل لكل شظية.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` أو `OPENCLAW_STATE_DIR` أو `OPENCLAW_CONFIG_PATH` أو مثبت إعدادات أو مساحة عمل أو دليل وكيل أو مخزن ملف تعريف مصادقة معزول.
- `pnpm test:env-mutations:report`: تقرير غير حاجب عن الاختبارات والعدد التي تعدل `HOME` أو `OPENCLAW_STATE_DIR` أو `OPENCLAW_CONFIG_PATH` أو `OPENCLAW_WORKSPACE_DIR` أو مفاتيح بيئة OpenClaw ذات الصلة مباشرة. استخدمه للعثور على مرشحين للانتقال إلى مساعد حالة الاختبار المشترك.
- E2E المحاكى لواجهة التحكم: استخدم `pnpm test:ui:e2e` لمسار Vitest + Playwright الذي يبدأ واجهة التحكم Vite ويقود صفحة Chromium حقيقية مقابل Gateway WebSocket محاكى. توجد الاختبارات في `ui/src/**/*.e2e.test.ts`؛ وتوجد المحاكيات وعناصر التحكم المشتركة في `ui/src/test-helpers/control-ui-e2e.ts`. يتضمن `pnpm test:e2e` هذا المسار. في أشجار عمل Codex، فضّل `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` لإثبات صغير موجه بعد تثبيت الاعتماديات، أو Testbox/Crabbox لإثبات واجهة رسومية أوسع.
- مساعدو E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- اختبارات TUI PTY: استخدم `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` لمسار PTY السريع ذي الخلفية المزيفة. استخدم `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` أو `pnpm tui:pty:test:watch --mode local` لفحص `tui --local` الأبطأ، الذي يحاكي نقطة نهاية النموذج الخارجية فقط. تحقق من نص مرئي ثابت أو استدعاءات مثبتات، وليس لقطات ANSI الخام.
- مساعدو Docker/Bash E2E: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمتصلين على مستوى أدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. يحافظ `--` قبل `create` على منع إصدارات Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تشغل Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI المحاكى، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدث تشغيلات الشظايا الكاملة، والإضافات، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل اللاحقة تلك التوقيتات لموازنة الشظايا البطيئة والسريعة. تضيف شظايا CI ذات أنماط التضمين اسم الشظية إلى مفتاح التوقيت، ما يبقي توقيتات الشظايا المفلترة مرئية دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- تمر ملفات اختبار `plugin-sdk` و`commands` المحددة الآن عبر مسارات خفيفة مخصصة تبقي `test/setup.ts` فقط، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- تعيَّن ملفات المصدر ذات الاختبارات الشقيقة إلى ذلك الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تستخدم تعديلات المساعدات تحت `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` رسم استيراد محليا لتشغيل الاختبارات المستوردة بدلا من تشغيل كل شظية على نطاق واسع عندما يكون مسار الاعتمادية دقيقا.
- ينقسم `auto-reply` الآن أيضا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرمز/المساعد الأخف في المستوى الأعلى.
- صار إعداد Vitest الأساسي يضبط افتراضيا `pool: "threads"` و`isolate: false`، مع تمكين المشغل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغلان كل شظايا الإضافات/Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة استيراد Vitest + تفصيل الاستيراد، مع الاستمرار في استخدام توجيه المسارات محددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجه مقابل تشغيل مشروع الجذر الأصلي للفرق نفسه الملتزم في git.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغل الوحدات (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغل كل إعداد ورقي لمجموعة Vitest الكاملة تسلسليا ويكتب بيانات مدة مجمعة إضافة إلى آثار JSON/سجلات لكل إعداد. يستخدم وكيل أداء الاختبار هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- `pnpm test:docker:timings <summary.json>` يفحص مسارات Docker البطيئة بعد تشغيل Docker شامل؛ استخدم `pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل موجهة ورخيصة من الآثار نفسها.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغل تجميعة E2E للمستودع: اختبارات فحص Gateway من البداية إلى النهاية إضافة إلى مسار E2E للمتصفح المحاكى في واجهة التحكم.
- `pnpm test:e2e:gateway`: يشغل اختبارات فحص Gateway من البداية إلى النهاية (اقتران WS/HTTP/node متعدد النسخ). يضبط افتراضيا `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للسجلات المفصلة.
- `pnpm test:live`: يشغل اختبارات المزود الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزود) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية بالإضافة إلى صورة وظيفية تثبّت ذلك الأرشيف في `/app`، ثم يشغّل مسارات فحص Docker باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتماديات Plugin؛ تركّب تلك المسارات أرشيف tarball المبني مسبقًا بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو محزّم الحزمة المحلي/CI الوحيد، ويتحقق من أرشيف tarball بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكه Docker. توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويوجد منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يُصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص بيانات الاعتماد، بدون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وافتراضيًا يساوي 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجموعة الذيل الحساسة للمزوّد وافتراضيًا يساوي 10. حدود المسارات الثقيلة افتراضيًا هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وحدود المزوّدين افتراضيًا هي مسار ثقيل واحد لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن أو الموارد الفعّال على مضيف منخفض التوازي، فيمكنه رغم ذلك البدء من مجموعة فارغة وسيعمل منفردًا حتى يحرر السعة. تُباعد بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف إنشاء عفريت Docker المحلي؛ ويمكن التجاوز باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، وينظف حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI الخاصة بالمزوّدين بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحية العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب بالأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات بدون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط مخرجات الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحية فقط؛ أسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في مجموعة واحدة بترتيب الأطول أولًا بحيث تستطيع دلاء المزوّدين تجميع أعمال Claude وCodex وGemini معًا. يتوقف المشغّل عن جدولة مسارات مجمّعة جديدة بعد أول إخفاق ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية مدتها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدودًا أضيق لكل مسار. أوامر إعداد Docker لخلفية CLI لها مهلة خاصة عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا مع Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- `pnpm test:docker:skill-install`: يثبّت أرشيف OpenClaw tarball المحزوم في مشغّل Docker عارٍ، ويعطل `skills.install.allowUploadedArchives`، ويحل اسمًا مختصرًا حاليًا لـ Skills من بحث ClawHub الحي، ويثبته عبر `openclaw skills install`، ويتحقق من `SKILL.md` و`.clawhub/origin.json` و`.clawhub/lock.json` و`skills info --json`.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركّزة، مثل `pnpm test:docker:live-cli-backend:claude` أو `pnpm test:docker:live-cli-backend:claude:resume` أو `pnpm test:docker:live-cli-backend:claude:mcp`. لدى Gemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية ممررة بالوكالة عبر `/api/chat/completions`. يتطلب مفتاح نموذج حيًا قابلًا للاستخدام، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون ثابتًا في CI مثل مجموعات اختبارات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعارات Claude إطارات MCP الخام لـ stdio مباشرة حتى يعكس الفحص ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبّت أرشيف OpenClaw tarball المحزوم فوق تجهيز مستخدم قديم غير نظيف، ويشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي بدون مفاتيح مزوّد حي أو قناة، ثم يبدأ Gateway عبر local loopback ويتحقق من بقاء الوكلاء، وتكوين القنوات، وقوائم سماح Plugin، وملفات مساحة العمل/الجلسة، وحالة اعتماديات Plugin القديمة المتروكة، وبدء التشغيل، وحالة RPC.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجود واقعية بدون مفاتيح مزوّد حي أو قناة، ويكوّن ذلك الأساس بوصفة أمر `openclaw config set` مدمجة، ويحدّث ذلك التثبيت المنشور إلى أرشيف OpenClaw tarball المحزوم، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويتحقق من أن المقاصد المكوّنة، وملفات مساحة العمل/الجلسة، وتكوين Plugin المتروك وحالة الاعتماديات القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC تبقى أو تُصلح بنظافة. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، أو أضف تجهيزات سيناريو باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة reported-issues `configured-plugin-installs` للتحقق من أن Plugins الخارجية المكوّنة لـ OpenClaw تُثبّت تلقائيًا أثناء الترقية، و`stale-source-plugin-shadow` لمنع ظلال Plugin المصدرية فقط من تعطيل بدء التشغيل. تكشف Package Acceptance هذه كـ `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، وتحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23` قبل تسليم مواصفات الحزمة الدقيقة إلى مسارات Docker.
- `pnpm test:docker:update-migration`: يشغّل إطار ناجي الترقية المنشورة في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تحدّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح وتثبت تنظيف اعتماديات Plugin المكوّنة خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل فحص التثبيت/التحديث للمسار المحلي، و`file:`، وحزم سجل npm ذات الاعتماديات المرفوعة، ومراجع git المتحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات اعتماد/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: "رد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي."

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

- `startup`:‏ `--version`، `--help`، `health`، `health --json`، `status --json`، `status`
- `real`:‏ `health`، `status`، `status --json`، `sessions`، `sessions --json`، `tasks --json`، `tasks list --json`، `tasks audit --json`، `agents list --json`، `gateway status`، `gateway status --json`، `gateway health --json`، `config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والأدنى/الأعلى، وتوزيع رمز الخروج/الإشارة، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل، بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف الحاضنة نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر الحزمة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف fixture الأساسي المودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بملف fixture باستخدام `pnpm test:startup:bench:check`

## قياس بدء تشغيل Gateway

السكربت: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

يفترض القياس افتراضيًا مدخل CLI المبني في `dist/entry.js`؛ شغّل
`pnpm build` قبل استخدام أوامر سكربت الحزمة. لقياس مشغّل المصدر
بدلًا من ذلك، مرّر `--entry scripts/run-node.mjs` وأبقِ تلك النتائج
منفصلة عن خطوط أساس مدخل البناء.

الاستخدام:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

معرّفات الحالات:

- `default`: بدء تشغيل Gateway عادي.
- `skipChannels`: بدء تشغيل Gateway مع تخطي بدء تشغيل القنوات.
- `oneInternalHook`: خطاف داخلي واحد مكوّن.
- `allInternalHooks`: كل الخطافات الداخلية.
- `fiftyPlugins`: 50 Plugin من ملفات manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin من ملفات manifest مؤجلة عند بدء التشغيل.

يتضمن الإخراج أول خرج للعملية، و`/healthz`، و`/readyz`، ووقت سجل استماع HTTP،
ووقت سجل جاهزية Gateway، ووقت CPU، ونسبة أنوية CPU، والحد الأقصى لـ RSS، والذاكرة heap، ومقاييس تتبع بدء التشغيل، وتأخير حلقة الأحداث، ومقاييس تفاصيل جدول البحث الخاص بالـ Plugin. يفعّل السكربت
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` في بيئة Gateway الفرعية.

اقرأ `/healthz` كمؤشر حياة: يمكن لخادم HTTP الرد. واقرأ `/readyz` كجاهزية
قابلة للاستخدام: استقرت مكونات Plugin الجانبية عند بدء التشغيل، والقنوات، والعمل
الحاسم للجاهزية بعد الإرفاق. تُرسل خطافات بدء تشغيل Gateway
بشكل غير متزامن وليست جزءًا من ضمان الجاهزية. وقت سجل الجاهزية هو طابع وقت
سجل الجاهزية الداخلي في Gateway؛ وهو مفيد للإسناد من جهة العملية
لكنه ليس بديلًا عن مسبار `/readyz` الخارجي.

استخدم إخراج JSON أو `--output` عند مقارنة التغييرات. استخدم `--cpu-prof-dir` فقط
بعد أن يشير إخراج التتبع إلى عمل استيراد أو ترجمة أو عمل مرتبط بالـ CPU لا يمكن
تفسيره من توقيتات المراحل وحدها. لا تقارن نتائج مشغّل المصدر بنتائج
`dist/entry.js` المبنية باعتبارها خط الأساس نفسه.

## قياس إعادة تشغيل Gateway

السكربت: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

قياس إعادة التشغيل مدعوم على macOS وLinux فقط. يستخدم SIGUSR1 لإعادات التشغيل
داخل العملية ويفشل فورًا على Windows.

يفترض القياس افتراضيًا مدخل CLI المبني في `dist/entry.js`؛ شغّل
`pnpm build` قبل استخدام أوامر سكربت الحزمة. لقياس مشغّل المصدر
بدلًا من ذلك، مرّر `--entry scripts/run-node.mjs` وأبقِ تلك النتائج
منفصلة عن خطوط أساس مدخل البناء.

الاستخدام:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

معرّفات الحالات:

- `skipChannels`: إعادة تشغيل مع تخطي القنوات.
- `skipChannelsAcpxProbe`: إعادة تشغيل مع تخطي القنوات وتشغيل مسبار بدء تشغيل ACPX.
- `skipChannelsNoAcpxProbe`: إعادة تشغيل مع تخطي القنوات وإيقاف مسبار بدء تشغيل ACPX.
- `default`: إعادة تشغيل عادية.
- `fiftyPlugins`: إعادة تشغيل مع 50 Plugin من ملفات manifest.

يتضمن الإخراج `/healthz` التالي، و`/readyz` التالي، ومدة التعطل، وتوقيت جاهزية
إعادة التشغيل، وCPU، وRSS، ومقاييس تتبع بدء التشغيل للعملية البديلة، ومقاييس تتبع إعادة التشغيل لمعالجة الإشارة، وتصريف العمل النشط، ومراحل الإغلاق، والبدء التالي، وتوقيت الجاهزية، ولقطات الذاكرة. يفعّل السكربت
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` و`OPENCLAW_GATEWAY_RESTART_TRACE=1` في
بيئة Gateway الفرعية.

استخدم هذا القياس عندما يلامس تغيير ما إشارات إعادة التشغيل، أو معالجات الإغلاق،
أو بدء التشغيل بعد إعادة التشغيل، أو إيقاف المكونات الجانبية، أو تسليم الخدمة، أو الجاهزية بعد
إعادة التشغيل. ابدأ بـ `skipChannels` عند عزل آليات Gateway عن بدء تشغيل
القنوات. استخدم `default` أو الحالات الثقيلة بالـ Plugin فقط بعد أن تفسر الحالة الضيقة
مسار إعادة التشغيل.

مقاييس التتبع مؤشرات إسناد، وليست أحكامًا. ينبغي الحكم على تغيير إعادة التشغيل
من عينات متعددة، ونطاق المالك المطابق، وسلوك `/healthz` و`/readyz`،
وعقد إعادة التشغيل المرئي للمستخدم.

## Onboarding E2E (Docker)

Docker اختياري؛ لا يلزم هذا إلا لاختبارات smoke للحاوية أثناء onboarding.

تدفق بدء بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات config/workspace/session، ثم يبدأ Gateway ويشغّل `openclaw health`.

## QR import smoke (Docker)

يضمن تحميل مساعد تشغيل QR المُصان ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، ومتوافق مع Node 22):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات والـ Plugin](/ar/help/testing-updates-plugins)

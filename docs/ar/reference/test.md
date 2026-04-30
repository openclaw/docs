---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعَي force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-30T08:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- حزمة الاختبار الكاملة (مجموعات الاختبار، الاختبار المباشر، Docker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يقتل أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذا بوابة تغطية وحدة للملفات المحملة، وليس تغطية لكل ملفات المستودع بالكامل. العتبات هي 70% للأسطر/الدوال/العبارات و55% للفروع. لأن `coverage.all` قيمته false، تقيس البوابة الملفات التي حملتها مجموعة تغطية الوحدة بدلًا من معاملة كل ملف مصدر في المسارات المقسمة كغير مغطى.
- `pnpm test:coverage:changed`: يشغل تغطية الوحدة فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار ذكي ورخيص للتغييرات. يشغل الأهداف الدقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وخرائط المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق الواسع/الإعدادات/الحزم ما لم تُطابق اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات واسع وصريح. استخدمه عندما ينبغي لتعديل في عدة الاختبار/الإعدادات/الحزمة أن يعود إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغل بوابة الفحص الذكية للتغييرات للفرق مقابل `origin/main`. يشغل أوامر فحص الأنواع، والlint، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- `pnpm test`: يمرر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. تستخدم التشغيلات غير المستهدفة مجموعات شظايا ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المحلي المتوازي؛ وتتوسع مجموعة الإضافات دائمًا إلى إعدادات الشظايا لكل إضافة بدل عملية مشروع جذر واحدة ضخمة.
- تنتهي تشغيلات مغلف الاختبارات بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه هو تفصيل كل شظية.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو مثبت إعدادات، أو مساحة عمل، أو دليل وكيل، أو مخزن ملفات تعريف المصادقة.
- مساعدات E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- مساعدات Docker/Bash E2E: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفكه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للنداءات منخفضة المستوى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. يحافظ `--` قبل `create` على أنظمة تشغيل Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وتشغيل Gateway في المقدمة/الخلفية، وفحوص الجاهزية، وتصدير بيئة الحالة، وتفريغات السجل، وتنظيف العمليات.
- تحدث تشغيلات الشظايا الكاملة، والإضافات، ونمط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل اللاحقة تلك التوقيتات لموازنة الشظايا البطيئة والسريعة. تضيف شظايا CI ذات نمط التضمين اسم الشظية إلى مفتاح التوقيت، ما يبقي توقيتات الشظايا المفلترة مرئية دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- يتم الآن تمرير ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تُبقي فقط `test/setup.ts`، وتترك الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- تُطابق ملفات المصدر ذات الاختبارات الشقيقة ذلك الاختبار الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تستخدم تعديلات المساعدات تحت `src/channels/plugins/contracts/test-helpers`، و`src/plugin-sdk/test-helpers`، و`src/plugins/contracts` مخطط استيراد محليًا لتشغيل الاختبارات المستوردة بدل تشغيل كل شظية على نطاق واسع عندما يكون مسار الاعتمادية دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- صار إعداد Vitest الأساسي يستخدم افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغل المشترك غير المعزول عبر إعدادات المستودع.
- يشغل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغل `pnpm test:extensions` و`pnpm test extensions` كل شظايا الإضافات/Plugins. تعمل إضافات القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تتبع أداء الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجه مقابل تشغيل مشروع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغل كل إعداد طرفي من مجموعة Vitest الكاملة تسلسليًا ويكتب بيانات مدة مجمعة بالإضافة إلى آثار JSON/سجل لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير مركز على الأداء.
- تكامل Gateway: اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغل اختبارات دخان Gateway من البداية إلى النهاية (إقران متعدد النسخ عبر WS/HTTP/node). يستخدم افتراضيًا `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات المطولة.
- `pnpm test:live`: يشغل الاختبارات الحية للموفرين (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالموفر) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني/يعيد استخدام صورة مشغل Node/Git عارية بالإضافة إلى صورة وظيفية تثبت ذلك الأرشيف في `/app`، ثم يشغل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبت/التحديث/اعتماديات Plugin؛ تثبت تلك المسارات الأرشيف المبني مسبقًا بدل استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو حازم الحزمة المحلي/CI الوحيد ويتحقق من الأرشيف بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكه Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يخرج `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص بيانات الاعتماد دون بناء أو تشغيل Docker. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وقيمته الافتراضية 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في حوض الذيل الحساس للموفر وقيمته الافتراضية 10. حدود المسارات الثقيلة الافتراضية هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وتكون حدود الموفرين افتراضيًا مسارًا ثقيلًا واحدًا لكل موفر عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد الحد الفعال للوزن أو الموارد على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من حوض فارغ وسيعمل وحده حتى يحرر السعة. يتم تأخير بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف إنشاء Docker daemon المحلية؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغل فحوص Docker مسبقة افتراضيًا، وينظف حاويات OpenClaw E2E القديمة، ويخرج حالة المسارات النشطة كل 30 ثانية، ويشارك مخازن أدوات CLI للموفرين بين المسارات المتوافقة، ويعيد محاولة إخفاقات الموفرين الحيين العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول إلى الأقصر في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات الموفرين الحيين فقط؛ أسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في حوض واحد مرتب من الأطول أولًا حتى تتمكن حاويات الموفرين من تجميع عمل Claude وCodex وGemini معًا. يتوقف المشغل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حي/ذيلية مختارة حدودًا أضيق لكل مسار. لدى أوامر إعداد Docker لخلفية CLI مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدر مدعومة بـChromium، ويبدأ CDP خامًا بالإضافة إلى Gateway معزول، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن روابط URL، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطارات الوصفية.
- يمكن تشغيل فحوص Docker الحية لخلفية CLI كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ`:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي صالحًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تشغل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بنمط Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام عبر stdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعليًا.

## بوابة PR المحلية

لإجراء فحوصات هبوط/بوابة PR محليًا، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفات محدودة الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## اختبار قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجه الافتراضي: “رد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- وسيط minimax ‏1279ms (الأدنى 1114، الأعلى 2431)
- وسيط opus ‏2454ms (الأدنى 1224، الأعلى 3170)

## اختبار قياس بدء تشغيل CLI

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

يتضمن الخرج `sampleCount`، والمتوسط، وp50، وp95، والأدنى/الأعلى، وتوزيع exit-code/signal، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم التوقيت والتقاط ملفات التعريف أداة الاختبار نفسها.

اصطلاحات الخرج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر اختبار smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر الحزمة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف fixture الأساسي المضمّن في المستودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المضمّن في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالـ fixture باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ لا يلزم هذا إلا لاختبارات smoke الخاصة بالتهيئة الأولية داخل الحاويات.

تدفق البدء البارد الكامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يشغّل هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات config/workspace/session، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR (Docker)

يضمن تحميل مساعد تشغيل QR المُصان ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذات صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)

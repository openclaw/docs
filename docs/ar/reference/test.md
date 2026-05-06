---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-05-06T08:12:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- حزمة الاختبار الكاملة (مجموعات الاختبارات، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من صحة التحديثات وحزمة Plugin: [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

- `pnpm test:force`: يقتل أي عملية Gateway متبقية تحتجز منفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ Gateway معزول كي لا تتصادم اختبارات الخادم مع مثيل قيد التشغيل. استخدم هذا عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذا حاجز تغطية لمسار الوحدة الافتراضي، وليس تغطية لكل ملفات المستودع كله. الحدود الدنيا هي 70% للأسطر/الدوال/العبارات و55% للفروع. لأن `coverage.all` يساوي false ومسار التغطية الافتراضي يقيّد نطاق التضمين إلى اختبارات الوحدة غير السريعة ذات ملفات المصدر الشقيقة، فإن الحاجز يقيس المصدر المملوك لهذا المسار بدلًا من كل استيراد عابر يصادف تحميله.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدة فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار تغييرات ذكي ورخيص. يشغّل أهدافًا دقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق الواسع/الإعدادات/الحزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات واسع وصريح. استخدمه عندما ينبغي لتعديل في عدة الاختبار/الإعدادات/الحزمة أن يرجع إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل حاجز الفحص الذكي للتغييرات للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع والـ lint والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبارات.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. تستخدم التشغيلات غير المستهدفة مجموعات تقسيم ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي المحلي؛ وتتوسع مجموعة الإضافات دائمًا إلى إعدادات التقسيم لكل إضافة بدلًا من عملية مشروع جذر واحدة ضخمة.
- تنتهي تشغيلات مغلف الاختبار بملخص قصير بصيغة `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه كتفصيل لكل تقسيم.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو نموذج إعدادات، أو مساحة عمل، أو دليل وكيل، أو مخزن ملف تعريف مصادقة.
- مساعدين E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- مساعدين E2E لـ Docker/Bash: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للنصوص متعددة الـ home تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمتصلين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. تحافظ `--` قبل `create` على ألا تعامل أوقات تشغيل Node الأحدث `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI وهمي، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث تشغيلات التقسيم الكاملة، والإضافات، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة لكامل الإعدادات هذه التوقيتات لموازنة التقسيمات البطيئة والسريعة. تضيف تقسيمات CI ذات نمط التضمين اسم التقسيم إلى مفتاح التوقيت، مما يبقي توقيتات التقسيمات المفلترة مرئية من دون استبدال بيانات توقيت كامل الإعدادات. عيّن `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أداة التوقيت المحلية.
- تُوجّه ملفات اختبارات `plugin-sdk` و`commands` المحددة الآن عبر مسارات خفيفة مخصصة لا تبقي إلا `test/setup.ts`، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- تُعيّن ملفات المصدر ذات الاختبارات الشقيقة إلى ذلك الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تستخدم تعديلات المساعدين تحت `src/channels/plugins/contracts/test-helpers`، و`src/plugin-sdk/test-helpers`، و`src/plugins/contracts` مخطط استيراد محليًا لتشغيل الاختبارات المستورِدة بدلًا من تشغيل كل تقسيم على نطاق واسع عندما يكون مسار الاعتمادية دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدين الأخف في المستوى الأعلى.
- أصبح إعداد Vitest الأساسي افتراضيًا إلى `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل تقسيمات الإضافات/Plugin. تعمل إضافات القنوات الثقيلة، وPlugin المتصفح، وOpenAI كتقسيمات مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة استيراد Vitest + تفصيل الاستيراد، مع الاستمرار في استخدام توجيه المسارات محدد النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس توصيف الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل مشروع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات worktree الحالية من دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعدادات Vitest الطرفية للمجموعة الكاملة تسلسليًا ويكتب بيانات المدة المجمعة إضافة إلى ملفات JSON/السجلات لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من طرف إلى طرف (إقران متعدد المثيلات عبر WS/HTTP/node). الافتراضي هو `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للسجلات المفصلة.
- `pnpm test:live`: يشغّل اختبارات المزود الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزود) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية إضافة إلى صورة وظيفية تثبّت تلك الحزمة في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتماديات Plugin؛ وتربط تلك المسارات حزمة tarball المبنية مسبقًا بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو حازم الحزم المحلي/CI الوحيد ويتحقق من tarball إضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكها Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوصات بيانات الاعتماد من دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات ويكون افتراضيًا 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في تجمع الذيل الحساس للمزود ويكون افتراضيًا 10. تكون حدود المسارات الثقيلة افتراضيًا `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وتكون حدود المزود افتراضيًا مسارًا ثقيلًا واحدًا لكل مزود عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن أو المورد الفعلي على مضيف منخفض التوازي، فما زال بإمكانه البدء من تجمع فارغ وسيعمل وحده حتى يحرر السعة. يتم تدرج بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف إنشاء Docker daemon محليًا؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحص Docker تمهيديًا افتراضيًا، وينظف حاويات E2E القديمة لـ OpenClaw، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك ذاكرات التخزين المؤقت لأدوات CLI الخاصة بالمزود بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزود الحي العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات من دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزود الحي فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع live-only مسارات live الرئيسية والذيلية في تجمع واحد مرتب من الأطول أولًا حتى تتمكن حاويات المزود من تعبئة عمل Claude وCodex وGemini معًا. يتوقف المشغّل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يتم تعيين `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية مدتها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ تستخدم مسارات live/tail المحددة حدودًا أكثر صرامة لكل مسار. لأوامر إعداد Docker الخلفية الخاصة بـ CLI مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا إضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- يمكن تشغيل مجسات Docker الحية للخلفية الخاصة بـ CLI كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويتحقق من `/api/models`، ثم يشغّل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حيًا صالحًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون ثابتًا في CI مثل مجموعات اختبارات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة البيانات وحاوية عميل ثانية تُشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات stdio MCP الخام مباشرةً بحيث يعكس اختبار الدخان ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبّت حزمة OpenClaw tarball المعبأة فوق نموذج مستخدم قديم متّسخ، ويشغّل تحديث الحزمة ثم doctor غير تفاعلي من دون مفاتيح موفّر أو قناة حية، ثم يبدأ Gateway عبر local loopback ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم السماح للـ Plugin، وملفات مساحة العمل/الجلسة، وحالة تبعيات Plugin القديمة المتقادمة، وبدء التشغيل، وحالة RPC.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجودة واقعية من دون مفاتيح موفّر أو قناة حية، ويهيئ خط الأساس هذا باستخدام وصفة أمر `openclaw config set` مضمّنة، ويحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw tarball المعبأة، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويتحقق من أن النوايا المهيأة، وملفات مساحة العمل/الجلسة، وإعدادات Plugin المتقادمة وحالة التبعيات القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC تبقى أو تُصلح بشكل نظيف. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، أو أضف نماذج سيناريو باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة reported-issues `configured-plugin-installs` للتحقق من أن OpenClaw plugins الخارجية المهيأة تُثبّت تلقائيًا أثناء الترقية، و`stale-source-plugin-shadow` لمنع ظلال Plugin المصدرية فقط من كسر بدء التشغيل. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز خط الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23` قبل تسليم مواصفات الحزم الدقيقة إلى مسارات Docker.
- `pnpm test:docker:update-migration`: يشغّل عُدّة published-upgrade survivor في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدّث كل حزمة مستقرة منشورة منذ `.23` فصاعدًا إلى المرشح وتثبت تنظيف تبعيات Plugin المهيأة خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل اختبار دخان للتثبيت/التحديث للمسار المحلي، و`file:`، وحزم سجل npm ذات التبعيات المرفوعة، ومراجع git المتحركة، ونماذج ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات إنزال/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل التعامل معه كتراجع، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- المطالبة الافتراضية: "ردّ بكلمة واحدة: ok. بدون علامات ترقيم أو نص إضافي."

آخر تشغيل (2025-12-31، 20 تشغيلاً):

- الوسيط minimax 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- الوسيط opus 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

## معيار بدء تشغيل CLI

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

يتضمن الناتج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رموز الخروج/الإشارات، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف نفس التجميعة.

اصطلاحات الناتج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر اختبار الدخان المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر الحزمة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف الأساس المضمّن في المستودع عند `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المضمّن في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع الملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ وهذا مطلوب فقط لاختبارات الدخان الخاصة بالإعداد الأولي ضمن الحاويات.

تدفق بدء بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر طرفية زائفة، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار دخان استيراد QR (Docker)

يتأكد من تحميل مساعد وقت تشغيل QR المعتمد ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذات صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

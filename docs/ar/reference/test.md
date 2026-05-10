---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع الفرض/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-05-10T20:00:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (الحزم، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من حزم التحديثات وPlugin: [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

- `pnpm test:force`: يقتل أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول كي لا تتصادم اختبارات الخادم مع مثيل قيد التشغيل. استخدم هذا عندما يترك تشغيل Gateway سابق المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية لمسار الوحدة الافتراضي، وليست تغطية لكل ملفات المستودع بالكامل. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. لأن `coverage.all` يساوي false ولأن نطاق المسار الافتراضي يحدد مشمولات التغطية إلى اختبارات الوحدة غير السريعة ذات ملفات مصدر شقيقة، تقيس البوابة المصدر المملوك لهذا المسار بدلًا من كل استيراد انتقالي يحدث أن تحمّله.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدة فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار تغييرات ذكي ومنخفض التكلفة. يشغّل أهدافًا دقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ورسم الاستيراد المحلي. يتم تخطي تغييرات العموم/الإعدادات/الحزمة ما لم تُعيَّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات واسع صريح. استخدمه عندما ينبغي أن يعود تعديل حزمة/إعداد/حاضنة اختبار إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة الفحص الذكي للتغييرات مقابل الفرق مع `origin/main`. يشغّل أوامر فحص الأنواع والـ lint والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. التشغيلات غير المستهدفة تستخدم مجموعات شظايا ثابتة وتتوسع إلى إعدادات ورقية للتنفيذ المتوازي المحلي؛ وتتوسع مجموعة الإضافات دائمًا إلى إعدادات الشظايا لكل إضافة بدلًا من عملية مشروع جذرية واحدة ضخمة.
- تنتهي تشغيلات مغلّف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه تفصيلًا لكل شظية.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج اختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو عنصر إعداد ثابت، أو مساحة عمل، أو دليل وكيل، أو مخزن ملفات تعريف مصادقة.
- مساعدين E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط السجلات، والتنظيف في مكان واحد.
- مساعدين E2E لـ Docker/Bash: يمكن للمسارات التي تصدّر `scripts/lib/docker-e2e-image.sh` أن تمرر `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وتفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمنادين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للتصدير. تحافظ `--` قبل `create` على منع إصدارات Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تشغّل Gateway تصدير `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث تشغيلات الشظايا الكاملة، والإضافات، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل اللاحقة تلك التوقيتات لموازنة الشظايا البطيئة والسريعة. تضيف شظايا CI بنمط التضمين اسم الشظية إلى مفتاح التوقيت، ما يحافظ على ظهور توقيتات الشظايا المفلترة دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- يتم الآن توجيه ملفات اختبار `plugin-sdk` و`commands` المختارة عبر مسارات خفيفة مخصصة تبقي فقط على `test/setup.ts`، مع ترك الحالات الثقيلة وقت التشغيل في مساراتها الحالية.
- ملفات المصدر ذات الاختبارات الشقيقة تُعيَّن إلى ذلك الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تعديلات المساعدين ضمن `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` تستخدم رسم استيراد محليًا لتشغيل الاختبارات المستورِدة بدلًا من تشغيل واسع لكل شظية عندما يكون مسار الاعتماد دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) كي لا تهيمن حاضنة الرد على اختبارات الحالة/الرموز/المساعدين الأخف في المستوى الأعلى.
- أصبح إعداد Vitest الأساسي يستخدم افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل غير المعزول المشترك عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل شظايا الإضافات/Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحدد النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل المشروع الجذري الأصلي للفرق نفسه الملتزم في git.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعدادات Vitest الورقية للمجموعة الكاملة تسلسليًا ويكتب بيانات مدة مجمّعة بالإضافة إلى آثار JSON/سجل لكل إعداد. يستخدم وكيل أداء الاختبارات هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمّعة بعد تغيير يركز على الأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من البداية إلى النهاية (اقتران متعدد المثيلات WS/HTTP/node). يستخدم افتراضيًا `threads` + `isolate: false` مع عمال متكيفين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للسجلات المطوّلة.
- `pnpm test:live`: يشغّل اختبارات المزوّد الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية بالإضافة إلى صورة وظيفية تثبّت ذلك الأرشيف في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتماد Plugin؛ وتحمّل تلك المسارات الأرشيف المبني مسبقًا بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو محزّم الحزمة المحلي/CI الوحيد ويتحقق من الأرشيف بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكه Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المختارة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المختارة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص الاعتماد دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات ويستخدم 10 افتراضيًا؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في حوض الذيل الحساس للمزوّد ويستخدم 10 افتراضيًا. حدود المسارات الثقيلة الافتراضية هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وتكون حدود المزوّدين افتراضيًا مسارًا ثقيلًا واحدًا لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفات الأكبر. إذا تجاوز مسار واحد حد الوزن أو المورد الفعّال على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من حوض فارغ وسيعمل وحده حتى يحرر السعة. يتم توزيع بدايات المسارات بفاصل ثانيتين افتراضيًا لتجنب عواصف إنشاء عفريت Docker المحلي؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، وينظف حاويات E2E القديمة لـ OpenClaw، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI للمزوّدين بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّد الحي العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيت. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات المحلية/الحتمية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّد الحي فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في حوض واحد مرتب من الأطول أولًا كي تتمكن دلاء المزوّدين من حزم أعمال Claude وCodex وGemini معًا. يتوقف المشغّل عن جدولة مسارات مجمّعة جديدة بعد أول فشل ما لم يتم تعيين `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية مختارة حدودًا أضيق لكل مسار. لأوامر إعداد Docker لخلفية CLI مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل موجهة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات دور CDP تتضمن روابط URL، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- `pnpm test:docker:skill-install`: يثبّت أرشيف OpenClaw المحزوم في مشغّل Docker عارٍ، ويعطّل `skills.install.allowUploadedArchives`، ويحل slug مهارة حاليًا من بحث ClawHub حي، ويثبّته عبر `openclaw skills install`، ويتحقق من `SKILL.md` و`.clawhub/origin.json` و`.clawhub/lock.json` و`skills info --json`.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركزة، على سبيل المثال `pnpm test:docker:live-cli-backend:codex` أو `pnpm test:docker:live-cli-backend:codex:resume` أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي قابلًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزوّدة ببيانات أولية وحاوية عميل ثانية تُطلق `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجَّهة، وقراءة النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تحقق إشعار Claude إطارات MCP الخام عبر stdio مباشرةً، بحيث يعكس اختبار smoke ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبّت حزمة OpenClaw المضغوطة بصيغة tarball فوق تجهيز مستخدم قديم متّسخ، ويشغّل تحديث الحزمة مع doctor غير تفاعلي من دون مفاتيح مزوّد أو قناة حية، ثم يبدأ Gateway عبر local loopback ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم سماح Plugin، وملفات مساحة العمل/الجلسة، وحالة اعتماد Plugin قديمة راكدة، وبدء التشغيل، وحالة RPC.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم حالي واقعية من دون مفاتيح مزوّد أو قناة حية، ويضبط ذلك الأساس بوصفة أمر `openclaw config set` مضمّنة، ويحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw المضغوطة بصيغة tarball، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويتحقق من أن النوايا المضبوطة، وملفات مساحة العمل/الجلسة، وإعدادات Plugin الراكدة وحالة الاعتماد القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC تبقى أو تُصلَح بشكل نظيف. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، أو أضف تجهيزات سيناريوهات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة reported-issues السيناريو `configured-plugin-installs` للتحقق من تثبيت إضافات OpenClaw الخارجية المضبوطة تلقائيًا أثناء الترقية، و`stale-source-plugin-shadow` لمنع ظلال Plugin المعتمدة على المصدر فقط من تعطيل بدء التشغيل. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23` قبل تسليم مواصفات الحزم الدقيقة إلى مسارات Docker.
- `pnpm test:docker:update-migration`: يشغّل أداة published-upgrade survivor في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير العمل المنفصل `Update Migration` هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدَّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح، ويُثبت تنظيف اعتماد Plugin المضبوط خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل اختبار smoke للتثبيت/التحديث للمسار المحلي، وحزم `file:`، وحزم سجل npm ذات الاعتمادات المرفوعة، ومراجع git المتحركة، وتجهيزات ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات اعتماد/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار زمن انتقال النموذج (مفاتيح محلية)

السكريبت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: "رُد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي."

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax وسيط 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- opus وسيط 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

## معيار بدء تشغيل CLI

السكريبت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم قياس التوقيت والتقاط ملف التعريف الحاضنة نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أداة smoke المستهدفة في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أداة المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف fixture الأساسي المضمّن في المستودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المضمّن في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع ملف fixture باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ ولا يلزم هذا إلا لاختبارات smoke الخاصة بالإعداد الأولي داخل الحاويات.

تدفق بدء بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكريبت المعالج التفاعلي عبر طرفية زائفة، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## QR import smoke (Docker)

يتأكد من تحميل مساعد تشغيل QR المُصان ضمن أزمنة تشغيل Docker Node المدعومة (Node 24 الافتراضي، وNode 22 المتوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات والPlugins](/ar/help/testing-updates-plugins)

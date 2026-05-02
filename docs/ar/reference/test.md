---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع الفرض/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-05-02T07:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (المجموعات، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من صحة حزم التحديث وPlugin: [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

- `pnpm test:force`: يقتل أي عملية Gateway متبقية تحتجز منفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل Gateway سابق المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية وحدة للملفات المحمّلة، وليست تغطية لكل ملفات المستودع بالكامل. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. ولأن `coverage.all` هي false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية الوحدة بدلًا من اعتبار كل ملف مصدر ضمن مسارات التجزئة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدة فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبارات تغييرات ذكي ورخيص. يشغّل أهدافًا دقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق العريض/الإعدادات/الحزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبارات تغييرات عريض وصريح. استخدمه عندما يجب أن يعود تعديل في أداة الاختبار/الإعدادات/الحزمة إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة الفحص الذكي للتغييرات للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع، والتدقيق، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. التشغيلات غير المستهدفة تستخدم مجموعات تجزئة ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي المحلي؛ وتتوسع مجموعة Plugin دائمًا إلى إعدادات التجزئة لكل Plugin بدلًا من عملية مشروع جذري ضخمة واحدة.
- تنتهي تشغيلات مغلّف الاختبارات بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه كتفصيل لكل تجزئة.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج اختبار إلى `HOME` أو `OPENCLAW_STATE_DIR` أو `OPENCLAW_CONFIG_PATH` أو مثبت إعدادات أو مساحة عمل أو دليل وكيل أو مخزن ملفات تعريف المصادقة معزول.
- مساعدات E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط السجلات، والتنظيف في مكان واحد.
- مساعدات E2E لـ Docker/Bash: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للنصوص متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمتصلين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. يحافظ `--` قبل `create` على منع إصدارات Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث تشغيلات التجزئة الكاملة وPlugin وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل اللاحقة تلك التوقيتات لموازنة التجزئات البطيئة والسريعة. تضيف تجزئات CI لنمط التضمين اسم التجزئة إلى مفتاح التوقيت، مما يحافظ على ظهور توقيتات التجزئات المرشحة دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أداة التوقيت المحلية.
- يتم الآن توجيه ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تُبقي فقط `test/setup.ts`، مع إبقاء الحالات الثقيلة في وقت التشغيل على مساراتها الحالية.
- ملفات المصدر ذات الاختبارات الشقيقة تُعيّن إلى ذلك الملف الشقيق قبل الرجوع إلى أنماط دليل أوسع. تستخدم تعديلات المساعدات ضمن `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` مخطط استيراد محليًا لتشغيل الاختبارات المستورِدة بدلًا من التشغيل العريض لكل تجزئة عندما يكون مسار الاعتماد دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا تهيمن أداة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- يضبط إعداد Vitest الأساسي الآن القيم الافتراضية إلى `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل تجزئات Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كتجزئات مخصصة؛ وتبقى مجموعات Plugins الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة استيراد Vitest وتفصيل الاستيراد، مع الاستمرار في استخدام توجيه المسارات محدد النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل مشروع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU وذاكرة heap لمشغّل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد Vitest طرفي للمجموعة الكاملة تسلسليًا ويكتب بيانات مدة مجمّعة بالإضافة إلى آثار JSON/سجلات لكل إعداد. يستخدمه وكيل أداء الاختبارات كأساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمّعة بعد تغيير يركّز على الأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway الشاملة (إقران متعدد النسخ عبر WS/HTTP/node). القيم الافتراضية هي `threads` + `isolate: false` مع عمّال تكيفيين في `vitest.e2e.config.ts`؛ اضبط باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للسجلات المطولة.
- `pnpm test:live`: يشغّل اختبارات المزوّد الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة ككرة tarball لـ npm، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية بالإضافة إلى صورة وظيفية تثبت كرة tarball تلك في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبت/التحديث/اعتماد Plugin؛ تركّب تلك المسارات كرة tarball مسبقة البناء بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو حازم الحزم المحلي/CI الوحيد ويتحقق من كرة tarball بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكها Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يُصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص الاعتماد دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وتكون قيمته الافتراضية 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في حوض الذيل الحساس للمزوّد وتكون قيمته الافتراضية 10. القيم الافتراضية لحدود المسارات الثقيلة هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وتكون حدود المزوّد الافتراضية مسارًا ثقيلًا واحدًا لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن أو الموارد الفعّال على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من حوض فارغ وسيعمل وحده حتى يحرر السعة. تبدأ المسارات بفاصل 2 ثانية افتراضيًا لتجنب عواصف إنشاء عفريت Docker المحلي؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصًا مسبقًا لـ Docker افتراضيًا، وينظف حاويات OpenClaw E2E الراكدة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI للمزوّد بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّد الحي العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط إخراج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيت. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّد الحي فقط؛ أسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في حوض واحد مرتب من الأطول أولًا حتى تتمكن مجموعات المزوّد من تجميع عمل Claude وCodex وGemini معًا. يتوقف المشغّل عن جدولة مسارات مجمّعة جديدة بعد أول إخفاق ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة قابلة للتجاوز باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدودًا أضيق لكل مسار. لأوامر إعداد Docker لخلفية CLI مهلة خاصة عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر التي يروّجها المؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركزة، على سبيل المثال `pnpm test:docker:live-cli-backend:codex` أو `pnpm test:docker:live-cli-backend:codex:resume` أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر وكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي قابلًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات الوحدة/E2E العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تُنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة والأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام لـ stdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبّت حزمة OpenClaw المضغوطة بصيغة tarball فوق fixture قديم لمستخدم يحتوي على تغييرات غير نظيفة، ويشغّل تحديث الحزمة مع doctor غير تفاعلي من دون مفاتيح موفّر أو قناة حية، ثم يبدأ Gateway عبر loopback ويتحقق من بقاء الوكلاء، وتكوين القناة، وقوائم السماح الخاصة بالـ Plugin، وملفات مساحة العمل/الجلسة، وحالة اعتماد Plugin القديمة المتقادمة، وبدء التشغيل، وحالة RPC سليمة.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات واقعية لمستخدم قائم من دون مفاتيح موفّر أو قناة حية، ويكوّن ذلك الأساس باستخدام وصفة أوامر `openclaw config set` مضمّنة، ثم يحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw المضغوطة بصيغة tarball، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر loopback ويتحقق من بقاء المقاصد المكوّنة، وملفات مساحة العمل/الجلسة، وتكوين Plugin المتقادم وحالة الاعتماد القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC أو إصلاحها بنظافة. يمكنك تجاوز أساس واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو توسيع مصفوفة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إضافة fixtures للسيناريوهات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ ويعرض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: يشغّل أداة اختبار البقاء بعد الترقية المنشورة في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدَّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح، ويثبت تنظيف اعتماد Plugin المكوّن خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل smoke للتثبيت/التحديث للمسار المحلي، وحزم `file:`، وحزم سجل npm ذات الاعتمادات المرفوعة، ومراجع git المتحركة، وfixtures الخاصة بـ ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات دمج/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن استجابة النموذج (مفاتيح محلية)

السكريبت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: "رد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي."

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- وسيط minimax ‏1279ms (الأدنى 1114، الأعلى 2431)
- وسيط opus ‏2454ms (الأدنى 1224، الأعلى 3170)

## قياس بدء تشغيل CLI

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

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والقيم الدنيا/العليا، وتوزيع أكواد الخروج/الإشارات، وملخصات أقصى RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل، بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف الحزمة نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر فحص الدخان المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف الأساس المثبت في المستودع عند `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف الاختبار المثبت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع ملف الاختبار باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ لا يلزم ذلك إلا لاختبارات دخان الإعداد داخل الحاويات.

تدفق بدء التشغيل البارد الكامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكريبت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## فحص دخان استيراد QR ‏(Docker)

يضمن تحميل مساعد وقت تشغيل QR المحافظ عليه ضمن بيئات تشغيل Docker Node المدعومة (Node 24 الافتراضي، وNode 22 المتوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)

---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعَي الإجبار/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-05-05T06:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (مجموعات الاختبار، الاختبار الحي، Docker): [الاختبار](/ar/help/testing)
- التحقق من التحديث وحزمة Plugin: [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

- `pnpm test:force`: يقتل أي عملية Gateway متبقية تشغل منفذ التحكم الافتراضي، ثم يشغل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولا.
- `pnpm test:coverage`: يشغل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية وحدة للملفات المحملة، وليست تغطية كل ملفات المستودع بالكامل. الحدود الدنيا هي 70% للأسطر/الدوال/العبارات و55% للفروع. بما أن `coverage.all` يساوي false، تقيس البوابة الملفات التي تحملها مجموعة تغطية الوحدة بدلا من اعتبار كل ملف مصدر في مسارات التقسيم غير مغطى.
- `pnpm test:coverage:changed`: يشغل تغطية الوحدة فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار ذكي رخيص للتغييرات. يشغل الأهداف الدقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق الواسع/الإعدادات/الحزم ما لم تكن مرتبطة باختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات واسع صريح. استخدمه عندما ينبغي أن يعود تعديل عدة الاختبار/الإعداد/الحزمة إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغل بوابة الفحص الذكي للتغييرات للفرق مقابل `origin/main`. يشغل أوامر فحص الأنواع، والتدقيق، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- `pnpm test`: يمرر أهداف الملفات/المجلدات الصريحة عبر مسارات Vitest محددة النطاق. تستخدم التشغيلات غير المستهدفة مجموعات تقسيم ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المحلي المتوازي؛ وتتوسع مجموعة الإضافات دائما إلى إعدادات التقسيم لكل إضافة بدلا من عملية مشروع جذري ضخمة واحدة.
- تنتهي تشغيلات مغلف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر المدة الخاص بVitest نفسه كتفصيل لكل جزء.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو مثبت إعدادات، أو مساحة عمل، أو مجلد وكيل، أو مخزن ملفات تعريف المصادقة.
- مساعدو E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط السجلات، والتنظيف في مكان واحد.
- مساعدو Docker/Bash E2E: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمنادين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف صدفة داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. يحافظ `--` قبل `create` على منع إصدارات Node الأحدث من التعامل مع `--env-file` كعلامة Node. يمكن لمسارات Docker/Bash التي تطلق Gateway أن تستورد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وإطلاق Gateway في المقدمة/الخلفية، وفحوص الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدث تشغيلات الأجزاء الكاملة، والإضافات، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة لكامل الإعداد تلك التوقيتات لموازنة الأجزاء البطيئة والسريعة. تضيف أجزاء CI بنمط التضمين اسم الجزء إلى مفتاح التوقيت، مما يبقي توقيتات الأجزاء المفلترة مرئية بدون استبدال بيانات توقيت كامل الإعداد. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- تمر الآن ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تبقي فقط `test/setup.ts`، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- تعين ملفات المصدر ذات الاختبارات الشقيقة إلى ذلك الشقيق قبل الرجوع إلى أنماط مجلدات أوسع. تستخدم تعديلات المساعدات تحت `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` مخطط استيراد محليا لتشغيل الاختبارات المستوردة بدلا من تشغيل كل جزء على نطاق واسع عندما يكون مسار الاعتمادية دقيقا.
- ينقسم `auto-reply` الآن أيضا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- صار إعداد Vitest الأساسي يستخدم افتراضيا `pool: "threads"` و`isolate: false`، مع تفعيل المشغل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغلان كل أجزاء الإضافات/Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كأجزاء مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مدمج واحد.
- `pnpm test:perf:imports`: يفعل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات محدد النطاق لأهداف الملفات/المجلدات الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجه مقابل تشغيل مشروع الجذر الأصلي لنفس فرق git المثبت.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون تثبيتها أولا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + الكومة لمشغل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغل كل إعدادات Vitest الطرفية للمجموعة الكاملة تسلسليا ويكتب بيانات مدة مجمعة بالإضافة إلى آثار JSON/سجلات لكل إعداد. يستخدم وكيل أداء الاختبارات هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- تكامل Gateway: تفعيله اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغل اختبارات دخان Gateway من البداية إلى النهاية (اقتران WS/HTTP/node متعدد النسخ). يستخدم افتراضيا `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات التفصيلية.
- `pnpm test:live`: يشغل اختبارات مزودي الخدمة الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزود) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كأرشيف npm، ويبني/يعيد استخدام صورة مشغل Node/Git مجردة بالإضافة إلى صورة وظيفية تثبت ذلك الأرشيف في `/app`، ثم يشغل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تستخدم الصورة المجردة (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبت/التحديث/اعتماديات Plugin؛ وتركب تلك المسارات الأرشيف المبني مسبقا بدلا من استخدام مصادر المستودع المنسوخة. تستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو محزم الحزم المحلي/CI الوحيد ويتحقق من الأرشيف بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكه Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص بيانات الاعتماد دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات ويستخدم 10 افتراضيا؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجموعة الذيل الحساسة للمزود ويستخدم 10 افتراضيا. حدود المسارات الثقيلة افتراضيا هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وحدود المزود الافتراضية هي مسار ثقيل واحد لكل مزود عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن الفعال أو حد الموارد على مضيف منخفض التوازي، يمكنه رغم ذلك البدء من مجموعة فارغة وسيعمل وحده حتى يحرر السعة. يتم توزيع بدايات المسارات بفاصل ثانيتين افتراضيا لتجنب عواصف إنشاء خادم Docker المحلي؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. ينفذ المشغل فحصا تمهيديا لDocker افتراضيا، وينظف حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI الخاصة بالمزود بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزود الحي العابرة مرة واحدة افتراضيا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول إلى الأقصر في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيت. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزود الحي فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط المسارات الحية الرئيسية والذيلية في مجموعة واحدة مرتبة من الأطول أولا حتى تتمكن حاويات المزود من تجميع عمل Claude وCodex وGemini معا. يتوقف المشغل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة قابلة للتجاوز باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدودا أضيق لكل مسار. أوامر إعداد Docker لخلفية CLI لها مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة رخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بChromium، ويبدأ CDP الخام بالإضافة إلى Gateway معزول، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن روابط URL، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات الإطارات الوصفية.
- يمكن تشغيل فحوص Docker الحية لخلفية CLI كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة ل`:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي قابل للاستخدام (مثلا OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يتوقع أن يكون مستقرا في CI مثل مجموعات اختبارات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مبذرة وحاوية عميل ثانية تطلق `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام لstdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعليا.
- `pnpm test:docker:upgrade-survivor`: يثبّت حزمة OpenClaw tarball المعبأة فوق fixture لمستخدم قديم بحالة غير نظيفة، ويشغّل تحديث الحزمة مع doctor غير تفاعلي من دون مفاتيح provider أو قناة مباشرة، ثم يبدأ Gateway عبر loopback ويفحص أن agents وإعدادات القنوات وقوائم السماح للـ plugin وملفات workspace/session وحالة تبعيات plugin القديمة الراكدة وبدء التشغيل وحالة RPC تبقى سليمة.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويجهّز ملفات مستخدم حالي واقعية من دون مفاتيح provider أو قناة مباشرة، ويهيّئ ذلك الأساس بوصفة أمر `openclaw config set` مضمنة، ثم يحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw tarball المعبأة، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر loopback ويفحص أن intents المهيأة وملفات workspace/session وإعدادات plugin الراكدة وحالة التبعيات القديمة وبدء التشغيل و`/healthz` و`/readyz` وحالة RPC تبقى سليمة أو تُصلَح بنظافة. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، أو أضف fixtures للسيناريوهات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة reported-issues كلًا من `configured-plugin-installs` للتحقق من أن Plugins الخارجية المهيأة لـ OpenClaw تُثبَّت تلقائيًا أثناء الترقية، و`stale-source-plugin-shadow` لمنع ظلال Plugins الموجودة في المصدر فقط من كسر بدء التشغيل. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23` قبل تمرير مواصفات الحزم الدقيقة إلى مسارات Docker.
- `pnpm test:docker:update-migration`: يشغّل منصة اختبار published-upgrade survivor في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدَّث كل حزمة مستقرة منشورة من `.23` وما بعده إلى المرشح، ويثبت تنظيف تبعيات Plugins المهيأة خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل اختبارات smoke للتثبيت/التحديث للمسار المحلي، وحزم `file:`، وحزم سجل npm ذات التبعيات المرفوعة، ومراجع git المتحركة، وfixtures الخاصة بـ ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لعمليات تحقق دمج/بوابة PR محليًا، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: “رد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- وسيط minimax ‏1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- وسيط opus ‏2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

## معيار قياس بدء تشغيل CLI

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

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الحد الأقصى، وتوزيع رموز الخروج/الإشارات، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم التقاط التوقيت وملفات التعريف نفس أداة الاختبار.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر اختبار smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف fixture الأساسي المدرج في المستودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المدرج في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع ملف fixture باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ هذا مطلوب فقط لاختبارات smoke الخاصة بالتهيئة ضمن الحاويات.

تدفق بدء بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR (Docker)

يضمن أن مساعد وقت تشغيل QR المُصان يُحمّل ضمن أوقات تشغيل Docker Node المدعومة (Node 24 افتراضي، Node 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)

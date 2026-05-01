---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي الإجبار/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-05-01T07:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d50f77fdb8dcf7153c59d1bd9f3d61d745ba17ea846eb0610d0f064ad0d1761
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (المجموعات، المباشر، Docker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يقتل أي عملية Gateway عالقة تمسك منفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول كي لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل Gateway سابق المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية وحدة للملفات المحمّلة، وليست تغطية لكل ملفات المستودع بأكمله. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. لأن `coverage.all` تساوي false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية الوحدة بدلًا من اعتبار كل ملف مصدر في المسارات المقسّمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدة فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبارات تغييرات ذكي ورخيص. يشغّل أهدافًا دقيقة من تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. تُتخطى تغييرات العموم/الإعدادات/الحزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبارات تغييرات واسع وصريح. استخدمه عندما ينبغي أن يعود تعديل حزمة/إعداد/مشغّل اختبار إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة فحص التغييرات الذكية للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع، واللنت، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار.
- `pnpm test`: يمرّر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. تستخدم عمليات التشغيل غير المستهدفة مجموعات شظايا ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي محليًا؛ وتتوسع مجموعة الامتدادات دائمًا إلى إعدادات الشظايا لكل امتداد بدلًا من عملية مشروع جذر واحدة ضخمة.
- تنتهي عمليات تشغيل مغلّف الاختبار بملخّص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه كتفاصيل لكل شظية.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو مثبت إعداد، أو مساحة عمل، أو دليل وكيل، أو مخزن ملفات تعريف مصادقة.
- مساعدات E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- مساعدات Docker/Bash لـ E2E: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن لسكربتات البيوت المتعددة تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمستدعين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. وجود `--` قبل `create` يمنع أوقات تشغيل Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وإطلاق Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث عمليات تشغيل الشظايا الكاملة، والامتدادات، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم عمليات تشغيل الإعداد الكامل اللاحقة تلك التوقيتات لموازنة الشظايا البطيئة والسريعة. تضيف شظايا CI ذات أنماط التضمين اسم الشظية إلى مفتاح التوقيت، مما يبقي توقيتات الشظايا المفلترة مرئية دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أداة التوقيت المحلية.
- تُمرّر ملفات اختبار `plugin-sdk` و`commands` المحددة الآن عبر مسارات خفيفة مخصصة لا تُبقي إلا `test/setup.ts`، مع إبقاء الحالات الثقيلة في وقت التشغيل على مساراتها الحالية.
- تُعيّن ملفات المصدر التي لها اختبارات شقيقة إلى ذلك الشقيق قبل الرجوع إلى أنماط glob أوسع للأدلة. تستخدم تعديلات المساعدات تحت `src/channels/plugins/contracts/test-helpers`، و`src/plugin-sdk/test-helpers`، و`src/plugins/contracts` مخطط استيراد محليًا لتشغيل الاختبارات التي تستوردها بدلًا من تشغيل كل شظية تشغيلًا واسعًا عندما يكون مسار الاعتماد دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) بحيث لا يهيمن مشغّل الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى العلوي.
- يضبط إعداد Vitest الأساسي الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل شظايا الامتدادات/Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة استيراد Vitest وتفصيلات الاستيراد، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل أداء الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل مشروع الجذر الأصلي للفرق نفسه الملتزم في git.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد طرفي من Vitest للمجموعة الكاملة تسلسليًا ويكتب بيانات مدة مجمّعة إضافة إلى ملفات JSON/سجلات لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمّعة بعد تغيير يركّز على الأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من طرف إلى طرف (إقران متعدد النسخ عبر WS/HTTP/node). الإعداد الافتراضي هو `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبط باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات المطوّلة.
- `pnpm test:live`: يشغّل اختبارات المزوّدين الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` خاصًا بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويغلّف OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية إضافة إلى صورة وظيفية تثبّت ذلك tarball في `/app`، ثم يشغّل مسارات دخان Docker باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتمادات Plugin؛ وتحمّل تلك المسارات tarball المبني مسبقًا بدلًا من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو مجمّع الحزم المحلي/CI الوحيد ويتحقق من tarball و`dist/postinstall-inventory.json` قبل أن يستهلكه Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ وتعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI التي يملكها المجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوصات بيانات الاعتماد دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وقيمته الافتراضية 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في تجمع الذيل الحساس للمزوّد وقيمته الافتراضية 10. حدود المسارات الثقيلة الافتراضية هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وحدود المزوّدين الافتراضية هي مسار ثقيل واحد لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن أو الموارد الفعال على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من تجمع فارغ وسيعمل منفردًا حتى يحرر السعة. تُباعد بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف إنشاء Docker daemon المحلية؛ ويمكن التجاوز باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصًا مسبقًا لـ Docker افتراضيًا، وينظف حاويات E2E القديمة الخاصة بـ OpenClaw، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخازن أدوات CLI للمزوّدين بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحية العابرة مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحية فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في تجمع واحد من الأطول أولًا بحيث يمكن لحاويات المزوّدين تجميع عمل Claude، وCodex، وGemini معًا. يتوقف المشغّل عن جدولة مسارات مجمّعة جديدة بعد أول إخفاق ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية مدتها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدودًا أضيق لكل مسار. لأوامر إعداد Docker لخلفية CLI مهلة خاصة عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا مع Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرفّعة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركّزة، مثل `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة وكيلة حقيقية عبر `/api/chat/completions`. يتطلب مفتاح نموذج حي قابلًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون ثابتًا في CI مثل مجموعات اختبارات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway ممهّدة وحاوية عميل ثانية تطلق `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام من stdio مباشرة بحيث يعكس اختبار الدخان ما يصدره الجسر فعليًا.
- `pnpm test:docker:upgrade-survivor`: يثبّت حزمة OpenClaw المعبأة بصيغة tarball فوق fixture لمستخدم قديم غير نظيف، ويشغّل تحديث الحزمة مع doctor غير تفاعلي من دون مفاتيح مزوّد أو قناة حية، ثم يبدأ Gateway عبر واجهة الاسترجاع ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم السماح للـ plugin، وملفات مساحة العمل/الجلسة، وحالة تبعيات وقت التشغيل القديمة للـ plugin، وبدء التشغيل، وحالة RPC سليمة.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجودة واقعية من دون مفاتيح مزوّد أو قناة حية، ويضبط خط الأساس هذا باستخدام وصفة أمر `openclaw config set` مضمّنة، ثم يحدّث ذلك التثبيت المنشور إلى حزمة OpenClaw المعبأة بصيغة tarball، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر واجهة الاسترجاع ويتحقق من أن النوايا المضبوطة، وملفات مساحة العمل/الجلسة، وحالة إعدادات/تبعيات وقت التشغيل القديمة للـ plugin، وبدء التشغيل، وحالة RPC تبقى سليمة أو تُصلَح بنظافة. تجاوز خط الأساس باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`؛ يعرّض Package Acceptance القيمة نفسها باسم `published_upgrade_survivor_baseline`.

## بوابة PR المحلية

لفحوصات هبوط/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين المقيّدين بالذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: “رد بكلمة واحدة: ok. بلا علامات ترقيم أو نص إضافي.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- وسيط minimax ‏1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- وسيط opus ‏2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

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

يتضمن المخرج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب `--cpu-prof-dir` / `--heap-prof-dir` الاختياري ملفات تعريف V8 لكل تشغيل، بحيث يستخدم التوقيت والتقاط ملف التعريف الحاضنة نفسها.

اصطلاحات المخرجات المحفوظة:

- يكتب `pnpm test:startup:bench:smoke` أداة smoke المستهدفة في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أداة الحزمة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف التثبيت الأساسي المضمّن في المستودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف التثبيت المضمّن في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بملف التثبيت باستخدام `pnpm test:startup:bench:check`

## E2E للإعداد الأولي (Docker)

Docker اختياري؛ لا يلزم هذا إلا لاختبارات smoke للإعداد الأولي داخل الحاويات.

تدفق بدء بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر طرفية زائفة، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## Smoke لاستيراد QR (Docker)

يضمن تحميل مساعد وقت تشغيل QR المصان ضمن أوقات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافقًا):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)

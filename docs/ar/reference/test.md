---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-05-02T21:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- حزمة الاختبار الكاملة (المجموعات، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحديث والتحقق من حزمة Plugin: [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

- `pnpm test:force`: ينهي أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغّل حزمة Vitest الكاملة بمنفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل Gateway سابق المنفذ 18789 مشغولاً.
- `pnpm test:coverage`: يشغّل حزمة اختبارات الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية وحدات للملفات المحمّلة، وليست تغطية لكل ملفات المستودع بأكمله. العتبات هي 70% للأسطر/الدوال/العبارات و55% للفروع. لأن `coverage.all` مضبوط على false، تقيس البوابة الملفات التي حمّلتها حزمة تغطية الوحدات بدلاً من معاملة كل ملف مصدر في مسار مقسّم كغير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبارات تغييرات ذكي ورخيص. يشغّل أهدافاً دقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. يتم تخطي تغييرات النطاق العريض/الإعدادات/الحزم ما لم تكن مرتبطة باختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل صريح لاختبارات التغييرات ذات النطاق العريض. استخدمه عندما ينبغي أن يرجع تعديل عدة الاختبار/الإعدادات/الحزمة إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة فحص التغييرات الذكية للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع، واللينت، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- `pnpm test`: يوجّه أهداف الملفات/المجلدات الصريحة عبر مسارات Vitest محددة النطاق. تستخدم التشغيلات غير المستهدفة مجموعات تقسيم ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي المحلي؛ وتتوسع مجموعة الامتدادات دائماً إلى إعدادات التقسيم لكل امتداد بدلاً من عملية مشروع جذرية ضخمة واحدة.
- تنتهي تشغيلات مغلّف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر المدة الخاص بـ Vitest هو تفصيل كل تقسيم.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو مثبت إعدادات، أو مساحة عمل، أو مجلد وكيل، أو مخزن ملفات تعريف المصادقة.
- مساعدات E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- مساعدات Docker/Bash E2E: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمستدعين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف شل داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. تبقي `--` قبل `create` بيئات تشغيل Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وتشغيل OpenAI الوهمي، وإطلاق Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغات السجلات، وتنظيف العمليات.
- تحدّث تشغيلات التقسيم الكاملة، وتقسيم الامتدادات، وتقسيم أنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل اللاحقة تلك التوقيتات لموازنة التقسيمات البطيئة والسريعة. تضيف تقسيمات CI ذات أنماط التضمين اسم التقسيم إلى مفتاح التوقيت، مما يبقي توقيتات التقسيمات المصفاة مرئية دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- يتم الآن توجيه ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تبقي فقط `test/setup.ts`، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- ملفات المصدر التي لها اختبارات شقيقة تُعيّن إلى ذلك الشقيق قبل الرجوع إلى أنماط مجلدات أوسع. تستخدم تعديلات المساعدات ضمن `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` مخطط استيراد محلياً لتشغيل الاختبارات المستوردة بدلاً من تشغيل كل تقسيم بنطاق عريض عندما يكون مسار الاعتمادية دقيقاً.
- يقسم `auto-reply` الآن أيضاً إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدات الأخف ذات المستوى الأعلى.
- أصبح إعداد Vitest الأساسي افتراضياً على `pool: "threads"` و`isolate: false`، مع تمكين مشغّل غير معزول مشترك عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` كل تقسيمات الامتدادات/plugins. تعمل plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كتقسيمات مخصصة؛ وتبقى مجموعات plugins الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/المجلدات الصريحة.
- `pnpm test:perf:imports:changed`: نفس توصيف الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجه مقابل تشغيل المشروع الجذري الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولاً.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد طرفي لـ Vitest في الحزمة الكاملة تسلسلياً ويكتب بيانات مدة مجمعة بالإضافة إلى آثار JSON/سجلات لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاحات الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- تكامل Gateway: اشترك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من البداية إلى النهاية (اقتران متعدد النسخ عبر WS/HTTP/node). الافتراضي هو `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات المفصلة.
- `pnpm test:live`: يشغّل اختبارات المزوّد الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاصة بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git عارية بالإضافة إلى صورة وظيفية تثبّت تلك الحزمة في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة العارية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات التثبيت/التحديث/اعتماديات Plugin؛ وتحمّل تلك المسارات الحزمة المبنية مسبقاً بدلاً من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو حازم الحزمة المحلي/CI الوحيد، ويتحقق من الحزمة بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكها Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص بيانات الاعتماد دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وافتراضياً 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في تجمع الذيل الحساس للمزوّد وافتراضياً 10. حدود المسارات الثقيلة الافتراضية هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وتفترض حدود المزوّد مساراً ثقيلاً واحداً لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد الوزن الفعال أو حد الموارد على مضيف منخفض التوازي، فما يزال بإمكانه البدء من تجمع فارغ وسيعمل وحده حتى يحرر السعة. يتم توزيع بدايات المسارات بفاصل ثانيتين افتراضياً لتجنب عواصف إنشاء عفريت Docker المحلي؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصاً قبلياً لـ Docker افتراضياً، وينظف حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI للمزوّد بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحيين العابرة مرة واحدة افتراضياً (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` لترتيب الأطول أولاً في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط مخرجات الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيت. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحيين فقط؛ أسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط المسارات الحية الرئيسية والذيلية في تجمع واحد بترتيب الأطول أولاً حتى تتمكن حاويات المزوّدين من حزم أعمال Claude وCodex وGemini معاً. يتوقف المشغّل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة قابلة للتجاوز باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حية/ذيلية محددة حدوداً أضيق لكل مسار. أوامر إعداد Docker للواجهة الخلفية للـ CLI لها مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة رخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP الخام بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر التي رُقّيت بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- يمكن تشغيل مجسات Docker الحية للواجهة الخلفية للـ CLI كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر وكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي قابل للاستخدام (مثلاً OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس متوقعاً أن يكون ثابتاً في CI مثل حزم اختبارات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام عبر stdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعلاً.
- `pnpm test:docker:upgrade-survivor`: يثبّت أرشيف OpenClaw المضغوط فوق fixture لمستخدم قديم بحالة غير نظيفة، ويشغّل تحديث الحزمة مع `doctor` غير تفاعلي من دون مفاتيح مزوّدين أو قنوات حية، ثم يبدأ Gateway على local loopback ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم السماح للـ plugin، وملفات مساحة العمل/الجلسات، وحالة اعتماد plugin القديم المتقادمة، وبدء التشغيل، وحالة RPC سليمة.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدمين حاليين واقعية من دون مفاتيح مزوّدين أو قنوات حية، ويضبط ذلك الأساس بوصفة أوامر `openclaw config set` مضمّنة، ويحدّث ذلك التثبيت المنشور إلى أرشيف OpenClaw المضغوط، ويشغّل `doctor` غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway على local loopback ويتحقق من أن النوايا المضبوطة، وملفات مساحة العمل/الجلسات، وإعدادات plugin المتقادمة وحالة الاعتماد القديم، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC تبقى سليمة أو تُصلح بشكل نظيف. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، أو أضف fixtures للسيناريوهات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة reported-issues السيناريو `configured-plugin-installs` للتحقق من أن Plugins الخارجية المضبوطة لـ OpenClaw تُثبّت تلقائيًا أثناء الترقية. يعرّض قبول الحزمة هذه القيم باسم `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: يشغّل حزمة اختبار ناجي الترقية المنشورة في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تحدّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح وتثبت تنظيف اعتماد plugin المضبوط خارج Full Release CI.
- `pnpm test:docker:plugins`: يشغّل فحصًا سريعًا للتثبيت/التحديث لمسار محلي، وحزم `file:`، وحزم سجل npm ذات الاعتمادات المرفوعة، ومراجع git المتحركة، وfixtures الخاصة بـ ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوصات هبوط/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجه الافتراضي: “رد بكلمة واحدة: ok. بدون علامات ترقيم أو نص إضافي.”

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

يتضمن الخرج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات RSS القصوى لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف نفس العدة.

اصطلاحات الخرج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر فحص الدخان المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف fixture الأساسي المُدخل في المستودع في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف fixture المُدخل في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بملف fixture باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ هذا مطلوب فقط لاختبارات دخان onboarding داخل الحاويات.

تدفق البدء البارد الكامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## فحص دخان استيراد QR (Docker)

يضمن تحميل مساعد وقت تشغيل QR المُصان ضمن أوقات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)

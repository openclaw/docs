---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع الفرض/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-05-05T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (مجموعات الاختبارات، المباشر، Docker): [الاختبار](/ar/help/testing)
- التحقق من التحديث وحزمة Plugin: [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins)

- `pnpm test:force`: يقتل أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولاً.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية وحدات للملفات المحمّلة، وليست تغطية لكل ملفات المستودع بالكامل. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. لأن `coverage.all` يساوي false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية الوحدات بدلاً من اعتبار كل ملف مصدر مقسّم إلى مسارات غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل رخيص وذكي لاختبارات التغييرات. يشغّل أهدافاً دقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ورسم الاستيراد المحلي. يتم تخطي تغييرات النطاق العريض/الإعدادات/الحزم ما لم تُعيَّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل صريح لاختبارات التغييرات واسعة النطاق. استخدمه عندما ينبغي أن يرجع تعديل في عدة الاختبار/الإعدادات/الحزمة إلى سلوك Vitest الأوسع لاختبارات التغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة الفحص الذكي للتغييرات للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع، والـ lint، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبارات.
- `pnpm test`: يمرّر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. التشغيلات غير المستهدفة تستخدم مجموعات تقسيم ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي المحلي؛ تتوسع مجموعة Plugin دائماً إلى إعدادات التقسيم لكل Plugin بدلاً من عملية مشروع جذر واحدة ضخمة.
- تنتهي تشغيلات غلاف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه تفصيلاً لكل تقسيم.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج اختبار إلى `HOME` معزول، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو ثابت إعدادات، أو مساحة عمل، أو دليل وكيل، أو مخزن ملفات تعريف المصادقة.
- مساعدات E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، والتنظيف في مكان واحد.
- مساعدات E2E لـ Docker/Bash: يمكن للمسارات التي تستخدم `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة البيوت تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمتصلين الأدنى مستوى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف shell داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستخدام كمصدر. يحافظ `--` قبل `create` على ألا تتعامل إصدارات Node الأحدث مع `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تطلق Gateway أن تستخدم `scripts/lib/openclaw-e2e-instance.sh` كمصدر داخل الحاوية لحل نقطة الدخول، وبدء OpenAI وهمي، وإطلاق Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث تشغيلات التقسيم الكاملة، وPlugin، وأنماط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم تشغيلات الإعداد الكامل لاحقاً هذه التوقيتات لموازنة التقسيمات البطيئة والسريعة. تضيف تقسيمات CI لنمط التضمين اسم التقسيم إلى مفتاح التوقيت، ما يبقي توقيتات التقسيمات المرشحة مرئية من دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أداة التوقيت المحلية.
- ملفات اختبار `plugin-sdk` و`commands` المحددة تمر الآن عبر مسارات خفيفة مخصصة تُبقي فقط `test/setup.ts`، مع ترك الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- ملفات المصدر ذات الاختبارات الشقيقة تُعيَّن إلى ذلك الشقيق قبل الرجوع إلى أنماط الأدلة الأوسع. تستخدم تعديلات المساعدات ضمن `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` رسم استيراد محلياً لتشغيل الاختبارات المستوردة بدلاً من تشغيل كل تقسيم على نطاق واسع عندما يكون مسار الاعتماد دقيقاً.
- `auto-reply` ينقسم الآن أيضاً إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- إعداد Vitest الأساسي يضبط الآن افتراضياً `pool: "threads"` و`isolate: false`، مع تمكين مشغّل عدم العزل المشترك عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل تقسيمات Plugin. تعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كتقسيمات مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات محددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل المشروع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية من دون الالتزام أولاً.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد طرفي لـ Vitest في المجموعة الكاملة تسلسلياً ويكتب بيانات مدة مجمعة بالإضافة إلى عناصر JSON/سجلات لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير موجه للأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من الطرف إلى الطرف (اقتران متعدد النسخ WS/HTTP/node). الإعداد الافتراضي هو `threads` + `isolate: false` مع عمّال متكيفين في `vitest.e2e.config.ts`؛ اضبط باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للسجلات المطولة.
- `pnpm test:live`: يشغّل الاختبارات الحية للمزوّدين (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git مجردة بالإضافة إلى صورة وظيفية تثبّت تلك الحزمة في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة المجردة (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتماد Plugin؛ وتثبّت تلك المسارات الحزمة المبنية مسبقاً بدلاً من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو محزّم الحزمة المحلي/CI الوحيد، ويتحقق من الحزمة بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكها Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI التي يملكها المجدول للمسارات المحددة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوصات الاعتماد من دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في فتحات العمليات وافتراضياً يساوي 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجموعة الذيل الحساسة للمزوّد وافتراضياً يساوي 10. حدود المسارات الثقيلة الافتراضية هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ وحدود المزوّد الافتراضية هي مسار ثقيل واحد لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن الفعلي أو حد الموارد على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من مجموعة فارغة وسيعمل وحده حتى يحرر السعة. تُؤخَّر بدايات المسارات بمقدار ثانيتين افتراضياً لتجنب عواصف إنشاء عفريت Docker المحلي؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. ينفذ المشغّل فحصاً أولياً لـ Docker افتراضياً، وينظف حاويات E2E القديمة لـ OpenClaw، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك مخابئ أدوات CLI للمزوّدين بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحية العابرة مرة واحدة افتراضياً (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولاً في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات من دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط مخرجات الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحية فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في مجموعة واحدة مرتبة من الأطول أولاً حتى تتمكن حاويات المزوّدين من تجميع أعمال Claude وCodex وGemini معاً. يتوقف المشغّل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يتم تعيين `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية مدتها 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم مسارات حي/ذيلية مختارة حدوداً أضيق لكل مسار. لأوامر إعداد Docker لخلفية CLI مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة ورخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خاماً بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركزة، مثلاً `pnpm test:docker:live-cli-backend:codex`، أو `pnpm test:docker:live-cli-backend:codex:resume`، أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي صالحاً للاستخدام (مثلاً OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون ثابتاً في CI مثل مجموعات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام عبر stdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعلياً.
- `pnpm test:docker:upgrade-survivor`: يثبّت أرشيف OpenClaw المضغوط فوق تجهيزة اختبار لمستخدم قديم غير نظيفة، ويشغّل تحديث الحزمة مع `doctor` غير تفاعلي بدون مفاتيح مزود أو قناة حية، ثم يبدأ Gateway بحلقة رجوع ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم السماح للـ plugin، وملفات مساحة العمل/الجلسة، وحالة اعتماد plugin القديمة الراكدة، وبدء التشغيل، وحالة RPC سليمة.
- `pnpm test:docker:published-upgrade-survivor`: يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجود واقعية بدون مفاتيح مزود أو قناة حية، ويضبط ذلك الخط الأساسي بوصفة أمر `openclaw config set` مضمّنة، ويحدّث ذلك التثبيت المنشور إلى أرشيف OpenClaw المضغوط، ويشغّل `doctor` غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway بحلقة رجوع ويتحقق من بقاء المقاصد المضبوطة، وملفات مساحة العمل/الجلسة، وإعدادات plugin الراكدة وحالة الاعتماد القديمة، وبدء التشغيل، و`/healthz`، و`/readyz`، وحالة RPC سليمة أو إصلاحها بنظافة. تجاوز خطًا أساسيًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، أو أضف تجهيزات سيناريو باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`؛ تتضمن مجموعة المشكلات المبلّغ عنها `configured-plugin-installs` للتحقق من تثبيت plugins OpenClaw الخارجية المضبوطة تلقائيًا أثناء الترقية و`stale-source-plugin-shadow` لمنع ظلال plugin المتوفرة في المصدر فقط من كسر بدء التشغيل. يعرّض قبول الحزمة هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: يشغّل عُدّة ناجي الترقية المنشورة في سيناريو `plugin-deps-cleanup` كثيف التنظيف، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` المنفصل هذا المسار باستخدام `baselines=all-since-2026.4.23` بحيث تُحدّث كل حزمة مستقرة منشورة من `.23` فصاعدًا إلى المرشح وتثبت تنظيف اعتماد plugin المضبوط خارج CI للإصدار الكامل.
- `pnpm test:docker:plugins`: يشغّل فحص install/update للتثبيت/التحديث للمسار المحلي، وحزم `file:`، وحزم سجل npm ذات الاعتمادات المرفوعة، ومراجع git المتحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude.

## بوابة PR المحلية

لفحوص دمج/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثّر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. للمضيفات محدودة الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## اختبار قياس زمن استجابة النموذج (مفاتيح محلية)

السكريبت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- الموجّه الافتراضي: “رُد بكلمة واحدة: موافق. بلا علامات ترقيم أو نص إضافي.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax الوسيط 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- opus الوسيط 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

## اختبار قياس بدء تشغيل CLI

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

يتضمن الخرج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف العدة نفسها.

اصطلاحات الخرج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر اختبار الدخان المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف أساس الاختبار المثبّت في المستودع عند `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

ملف الاختبار المثبّت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّث باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بملف الاختبار باستخدام `pnpm test:startup:bench:check`

## E2E للتهيئة الأولية (Docker)

Docker اختياري؛ هذا مطلوب فقط لاختبارات دخان التهيئة الأولية داخل الحاويات.

تدفق بدء التشغيل البارد الكامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكريبت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار دخان استيراد QR (Docker)

يضمن تحميل مساعد وقت تشغيل QR المُصان ضمن أوقات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

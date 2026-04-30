---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم أوضاع force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-30T18:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- مجموعة الاختبار الكاملة (مجموعات الاختبار، المباشر، Docker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يقتل أي عملية Gateway عالقة تحتفظ بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة بمنفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل Gateway سابق المنفذ 18789 مشغولاً.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدة مع تغطية V8 عبر `vitest.unit.config.ts`. هذه بوابة تغطية وحدة للملفات المحمّلة، وليست تغطية كل الملفات على مستوى المستودع كله. الحدود هي 70% للأسطر/الدوال/العبارات و55% للفروع. لأن `coverage.all` قيمتها false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية الوحدة بدلاً من اعتبار كل ملف مصدر في المسارات المقسمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدة فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:changed`: تشغيل اختبار تغييرات ذكي ورخيص. يشغّل الأهداف الدقيقة من تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ورسم الاستيراد المحلي. تُتجاوز تغييرات النطاق العريض/الإعدادات/الحزم ما لم تُعيّن إلى اختبارات دقيقة.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: تشغيل اختبار تغييرات عريض صريح. استخدمه عندما يجب أن يعود تعديل في حزام الاختبار/الإعدادات/الحزمة إلى سلوك اختبارات التغييرات الأوسع في Vitest.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يطلقها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة فحص التغييرات الذكية للفرق مقابل `origin/main`. يشغّل أوامر فحص الأنواع، والفحص الساكن، والحراسة للمسارات المعمارية المتأثرة، لكنه لا يشغّل اختبارات Vitest. استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار.
- `pnpm test`: يمرّر أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. تستخدم عمليات التشغيل غير المستهدفة مجموعات تقسيم ثابتة وتتوسع إلى إعدادات طرفية للتنفيذ المتوازي المحلي؛ وتتوسع مجموعة Plugin دائماً إلى إعدادات التقسيم لكل Plugin بدلاً من عملية مشروع جذر واحدة ضخمة.
- تنتهي عمليات تشغيل غلاف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`. يبقى سطر مدة Vitest نفسه تفصيلاً لكل تقسيم.
- حالة اختبار OpenClaw المشتركة: استخدم `src/test-utils/openclaw-test-state.ts` من Vitest عندما يحتاج الاختبار إلى `HOME`، أو `OPENCLAW_STATE_DIR`، أو `OPENCLAW_CONFIG_PATH`، أو عنصر إعدادات اختبار، أو مساحة عمل، أو دليل وكيل، أو مخزن ملفات تعريف المصادقة معزول.
- مساعدين E2E للعمليات: استخدم `test/helpers/openclaw-test-instance.ts` عندما يحتاج اختبار E2E على مستوى عملية Vitest إلى Gateway قيد التشغيل، وبيئة CLI، والتقاط سجلات، وتنظيف في مكان واحد.
- مساعدين E2E لـ Docker/Bash: يمكن للمسارات التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للسكربتات متعددة المنازل تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يمكن للمستدعين ذوي المستوى الأدنى استخدام `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` لمقتطف صدفة داخل الحاوية، أو `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` لملف بيئة مضيف قابل للاستيراد. يحافظ `--` قبل `create` على منع إصدارات Node الأحدث من معاملة `--env-file` كعلم Node. يمكن لمسارات Docker/Bash التي تشغّل Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` داخل الحاوية لحل نقطة الدخول، وبدء OpenAI الوهمي، وتشغيل Gateway في المقدمة/الخلفية، ومجسات الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.
- تحدّث عمليات تشغيل التقسيم الكاملة وPlugin ونمط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم عمليات التشغيل اللاحقة لكامل الإعدادات تلك التوقيتات لموازنة التقسيمات البطيئة والسريعة. تضيف تقسيمات CI بنمط التضمين اسم التقسيم إلى مفتاح التوقيت، مما يبقي توقيتات التقسيم المصفاة مرئية دون استبدال بيانات توقيت كامل الإعدادات. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل عنصر التوقيت المحلي.
- تمر الآن ملفات اختبار `plugin-sdk` و`commands` المختارة عبر مسارات خفيفة مخصصة لا تبقي إلا `test/setup.ts`، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- تعيّن ملفات المصدر ذات الاختبارات الشقيقة إلى ذلك الشقيق قبل الرجوع إلى أنماط أدلة أوسع. تستخدم تعديلات المساعدين تحت `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` رسم استيراد محلياً لتشغيل الاختبارات المستوردة بدلاً من تشغيل كل تقسيم على نطاق واسع عندما يكون مسار الاعتمادية دقيقاً.
- ينقسم `auto-reply` الآن أيضاً إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا يهيمن حزام الرد على اختبارات الحالة/الرموز/المساعدين الأخف في المستوى الأعلى.
- تصبح إعدادات Vitest الأساسية الآن افتراضياً `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان كل تقسيمات Plugin. تعمل Plugins القنوات الثقيلة وPlugin المتصفح وOpenAI كتقسيمات مخصصة؛ وتبقى مجموعات Plugin الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يمكّن تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات محدد النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس توصيف الاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقابل تشغيل المشروع الجذري الأصلي للفرق نفسه الملتزم في git.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولاً.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد طرفي لمجموعة Vitest الكاملة تسلسلياً ويكتب بيانات مدة مجمعة بالإضافة إلى عناصر JSON/سجلات لكل إعداد. يستخدمه وكيل أداء الاختبارات كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير مركّز على الأداء.
- تكامل Gateway: الاشتراك عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات دخان Gateway من طرف إلى طرف (اقتران متعدد النسخ عبر WS/HTTP/node). الافتراضي هو `threads` + `isolate: false` مع عمال تكيفيين في `vitest.e2e.config.ts`؛ اضبط باستخدام `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للسجلات المطوّلة.
- `pnpm test:live`: يشغّل اختبارات المزوّدين الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` أو `*_LIVE_TEST=1` الخاص بالمزوّد لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني/يعيد استخدام صورة مشغّل Node/Git مجردة بالإضافة إلى صورة وظيفية تثبّت ذلك tarball في `/app`، ثم يشغّل مسارات دخان Docker مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. تُستخدم الصورة المجردة (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) لمسارات المثبّت/التحديث/اعتمادية Plugin؛ وتحمّل تلك المسارات tarball المسبق البناء بدلاً من استخدام مصادر المستودع المنسوخة. تُستخدم الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) لمسارات وظائف التطبيق المبني العادية. `scripts/package-openclaw-for-docker.mjs` هو حازم الحزمة المحلي/CI الوحيد ويتحقق من tarball بالإضافة إلى `dist/postinstall-inventory.json` قبل أن يستهلكه Docker. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المختارة. يصدر `node scripts/test-docker-all.mjs --plan-json` خطة CI المملوكة للمجدول للمسارات المختارة، وأنواع الصور، واحتياجات الحزمة/الصورة الحية، وسيناريوهات الحالة، وفحوص الاعتماديات دون بناء Docker أو تشغيله. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في خانات العمليات وافتراضه 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجمع الذيل الحساس للمزوّدين وافتراضه 10. الحدود الافتراضية للمسارات الثقيلة هي `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ والحدود الافتراضية للمزوّدين هي مسار ثقيل واحد لكل مزوّد عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. إذا تجاوز مسار واحد حد الوزن أو المورد الفعلي على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من مجمع فارغ وسيعمل وحده حتى يحرر السعة. تتباعد بدايات المسارات بمقدار ثانيتين افتراضياً لتجنب عواصف إنشاء Docker daemon المحلية؛ تجاوز ذلك باستخدام `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يجري المشغّل فحصاً مسبقاً لـ Docker افتراضياً، وينظف حاويات E2E قديمة لـ OpenClaw، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك ذاكرات التخزين المؤقت لأدوات CLI الخاصة بالمزوّد بين المسارات المتوافقة، ويعيد محاولة إخفاقات المزوّدين الحيين العابرة مرة واحدة افتراضياً (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول أولاً في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط خرج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيت. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات المزوّدين الحيين فقط؛ وأسماء الحزم البديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الحي فقط مسارات الحي الرئيسية والذيلية في مجمع واحد مرتّب من الأطول أولاً حتى تستطيع حاويات المزوّدين تجميع عمل Claude وCodex وGemini معاً. يتوقف المشغّل عن جدولة مسارات مجمعة جديدة بعد أول إخفاق ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة قابلة للتجاوز باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ تستخدم مسارات حية/ذيلية مختارة حدوداً أضيق لكل مسار. أوامر إعداد Docker لخلفية CLI لها مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). تُكتب سجلات كل مسار، و`summary.json`، و`failures.json`، وتوقيتات المراحل تحت `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل مستهدفة رخيصة.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خاماً بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطارات.
- يمكن تشغيل مجسات Docker الحية لخلفية CLI كمسارات مركزة، مثل `pnpm test:docker:live-cli-backend:codex` أو `pnpm test:docker:live-cli-backend:codex:resume` أو `pnpm test:docker:live-cli-backend:codex:mcp`. لدى Claude وGemini أسماء بديلة مطابقة مع `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر وسيط من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي صالحاً للاستخدام (مثلاً OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس متوقعاً أن يكون ثابتاً في CI مثل مجموعات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك صف الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تأكيد إشعار Claude إطارات MCP الخام على stdio مباشرة حتى يعكس اختبار الدخان ما يصدره الجسر فعلاً.
- `pnpm test:docker:upgrade-survivor`: يثبّت أرشيف OpenClaw المعبأ بصيغة tarball فوق fixture قديمة ومتسخة لمستخدم قديم، ويشغّل تحديث الحزمة مع doctor غير تفاعلي من دون مفاتيح مزود مباشر أو قنوات، ثم يبدأ Gateway عبر local loopback ويتحقق من بقاء الوكلاء، وإعدادات القنوات، وقوائم السماح للـ Plugin، وملفات مساحة العمل/الجلسات، وحالة runtime-deps القديمة الخاصة بالـ Plugin، وبدء التشغيل، وحالة RPC.

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

## قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- بيئة اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- المطالبة الافتراضية: “أجب بكلمة واحدة: ok. بدون علامات ترقيم أو نص إضافي.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax الوسيط 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- opus الوسيط 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

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

يتضمن الناتج `sampleCount`، المتوسط، p50، p95، الحد الأدنى/الأقصى، توزيع رموز الخروج/الإشارات، وملخصات الحد الأقصى لـ RSS لكل أمر. يكتب الخياران الاختياريان `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم التوقيت والتقاط الملف التعريفي نفس عدة التشغيل.

اصطلاحات الناتج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أداة الفحص السريع المستهدفة في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أداة المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` تثبيت خط الأساس المضمّن في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

التثبيت المضمّن:

- `test/fixtures/cli-startup-bench.json`
- حدّث باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالتثبيت باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ هذا مطلوب فقط لاختبارات الفحص السريع للحاويات أثناء Onboarding.

تدفق بدء كامل من حالة باردة داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر طرفية زائفة، ويتحقق من ملفات الإعدادات/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## فحص سريع لاستيراد QR (Docker)

يتأكد من تحميل مساعد تشغيل QR المصان ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، ومتوافق مع Node 22):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)

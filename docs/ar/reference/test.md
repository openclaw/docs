---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي force وcoverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-26T11:40:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- مجموعة الاختبار الكاملة (الأجنحة، والاختبارات الحية، وDocker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يوقف أي عملية Gateway عالقة تحتفظ بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ Gateway معزول حتى لا تتعارض اختبارات الخادم مع مثيل يعمل بالفعل. استخدم هذا عندما يترك تشغيل سابق لـ Gateway المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدات مع تغطية V8 ‏(عبر `vitest.unit.config.ts`). وهذه بوابة تغطية لوحدات الملفات المحمّلة، وليست تغطية لجميع ملفات المستودع. الحدود هي 70% للأسطر/الدوال/التعليمات و55% للفروع. ولأن `coverage.all` مضبوط على false، فإن البوابة تقيس الملفات التي حمّلتها مجموعة تغطية الوحدات بدلًا من اعتبار كل ملف مصدر في المسارات المقسّمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest مقيّدة عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه. أما تغييرات الإعداد/التهيئة فتعود إلى تشغيل مشاريع الجذر الأصلية، حتى تعيد تعديلات التوصيل التشغيل على نطاق واسع عند الحاجة.
- `pnpm test:changed:focused`: تشغيل اختبارات الحلقة الداخلية للتغييرات. وهو يشغّل فقط الأهداف الدقيقة الناتجة عن تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وخرائط المصدر الصريحة، ومخطط الاستيراد المحلي. وتُتخطى التغييرات الواسعة/الخاصة بالإعداد/الحزم بدلًا من التوسّع إلى بديل الاختبار الكامل للتغييرات.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقابل `origin/main`. فهو يشغّل أعمال النواة مع مسارات اختبارات النواة، وأعمال الامتدادات مع مسارات اختبارات الامتدادات، والأعمال الخاصة بالاختبارات فقط مع فحص الأنواع/الاختبارات الخاصة بالاختبارات فقط، ويوسّع تغييرات SDK العامة الخاصة بـ Plugin أو عقود Plugin إلى تمريرة تحقق واحدة للامتدادات، ويحافظ على زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط ضمن فحوصات مستهدفة للإصدار/الإعداد/اعتماديات الجذر.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest مقيّدة. وتستخدم التشغيلات غير المستهدفة مجموعات شظايا ثابتة وتتوسع إلى إعدادات فرعية للتنفيذ المحلي المتوازي؛ كما أن مجموعة الامتدادات تتوسع دائمًا إلى إعدادات الشظايا الخاصة بكل امتداد بدلًا من عملية مشروع جذرية ضخمة واحدة.
- تقوم تشغيلات الشظايا الكاملة، وشظايا الامتدادات، والتشغيلات القائمة على أنماط التضمين بتحديث بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة للإعداد الكامل هذه التوقيتات لموازنة الشظايا البطيئة والسريعة. وتُلحق شظايا CI القائمة على أنماط التضمين اسم الشظية بمفتاح التوقيت، ما يُبقي توقيتات الشظايا المفلترة مرئية من دون استبدال بيانات توقيت الإعداد الكامل. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل ملف التوقيت المحلي.
- تُوجَّه الآن ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تُبقي فقط `test/setup.ts`، مع إبقاء الحالات الثقيلة في بيئة التشغيل على مساراتها الحالية.
- تُربط ملفات المصدر التي لها اختبارات شقيقة بذلك الاختبار الشقيق قبل الرجوع إلى أنماط glob أوسع على مستوى الدليل. كما تستخدم تعديلات المساعدات تحت `test/helpers/channels` و`test/helpers/plugins` مخطط استيراد محلي لتشغيل الاختبارات المستورِدة بدلًا من التشغيل الواسع لكل شظية عندما يكون مسار الاعتماد دقيقًا.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) بحيث لا يهيمن تسخير الرد على اختبارات الحالة/الرمز/المساعدات الأخف على المستوى الأعلى.
- يستخدم إعداد Vitest الأساسي الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تفعيل المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع شظايا الامتدادات/Plugins. وتعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كشظايا مخصصة؛ بينما تبقى مجموعات Plugins الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفاصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المقيّدة لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات المتغيرة منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقارنةً بتشغيل مشروع الجذر الأصلي لنفس فرق git المعتمد.
- `pnpm test:perf:changed:bench -- --worktree` يقيس مجموعة تغييرات شجرة العمل الحالية من دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي لـ Vitest ‏(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد فرعي لـ Vitest ضمن المجموعة الكاملة بشكل تسلسلي ويكتب بيانات مدد مجمّعة بالإضافة إلى ملفات JSON/سجلات لكل إعداد. يستخدم Test Performance Agent هذا كأساس قبل محاولة إصلاحات الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمّعة بعد تغيير يركز على الأداء.
- تكامل Gateway: الاشتراك اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke الشاملة لـ Gateway ‏(إقران متعدد المثيلات عبر WS/HTTP/node). ويستخدم افتراضيًا `threads` مع `isolate: false` ومعالِجات متكيفة في `vitest.e2e.config.ts`؛ ويمكن ضبطه عبر `OPENCLAW_E2E_WORKERS=<n>` وضبط `OPENCLAW_E2E_VERBOSE=1` لسجلات مفصلة.
- `pnpm test:live`: يشغّل الاختبارات الحية للموفّرين (minimax/zai). ويتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بكل موفّر) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة وصورة Docker ‏E2E مرة واحدة، ثم يشغّل مسارات Docker smoke مع `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول مرجّح. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في فتحات العمليات والقيمة الافتراضية له 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجموعة الذيل الحساسة للموفّر والقيمة الافتراضية له 10. وتكون حدود المسارات الثقيلة افتراضيًا `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ بينما تكون حدود الموفّرين افتراضيًا مسارًا ثقيلًا واحدًا لكل موفّر عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفين الأكبر. وتُباعد بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف الإنشاء في Docker daemon المحلي؛ ويمكن التجاوز عبر `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. ويجري المشغّل فحصًا مسبقًا لـ Docker افتراضيًا، وينظف حاويات OpenClaw E2E الراكدة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك ذاكرات التخزين المؤقت لأدوات CLI الخاصة بالموفّرين بين المسارات المتوافقة، ويعيد محاولة الإخفاقات المؤقتة لموفّري البث الحي مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزّن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` لترتيب الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات من دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط مخرجات الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات المحلية/الحتمية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات الموفّرين الحية فقط؛ وأسماء الحزم المستعارة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. ويجمع وضع البث الحي فقط بين مسارات البث الحي الرئيسية والذيلية في مجموعة واحدة مرتبة من الأطول إلى الأقصر حتى تتمكن مجموعات الموفّرين من تجميع أعمال Claude وCodex وGemini معًا. ويتوقف المشغّل عن جدولة مسارات مجمّعة جديدة بعد أول فشل ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة احتياطية قدرها 120 دقيقة يمكن تجاوزها عبر `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`؛ وتستخدم بعض المسارات الحية/الذيلية المحددة حدودًا أشد لكل مسار. كما أن أوامر إعداد Docker الخاصة بخلفية CLI لها مهلة خاصة بها عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (الافتراضي 180). وتُكتب سجلات كل مسار تحت `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: يبني حاوية E2E مصدرية مدعومة بـ Chromium، ويبدأ CDP خامًا بالإضافة إلى Gateway معزول، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تتضمن عناوين الروابط، والعناصر القابلة للنقر التي تمّت ترقيتها بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- يمكن تشغيل مجسّات Docker الحية لخلفية CLI كمسارات مركّزة، مثل `pnpm test:docker:live-cli-backend:codex` أو `pnpm test:docker:live-cli-backend:codex:resume` أو `pnpm test:docker:live-cli-backend:codex:mcp`. كما أن Claude وGemini لديهما أسماء مستعارة مماثلة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw وOpen WebUI ضمن Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل دردشة حقيقية ممرّرة عبر الوكيل من خلال `/api/chat/completions`. ويتطلب مفتاح نموذج حي قابلًا للاستخدام (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس متوقعًا أن يكون مستقرًا في CI مثل مجموعات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة، ثم حاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات السجل، وبيانات المرفقات الوصفية، وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. وتقرأ عملية التأكيد الخاصة بإشعارات Claude إطارات MCP الخام عبر stdio مباشرةً حتى يعكس اختبار smoke ما يصدره الجسر فعليًا.

## بوابة PR المحلية

لفحوصات البوابة/الاعتماد المحلية الخاصة بـ PR، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا كان `pnpm test` يعاني من flake على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. وبالنسبة إلى المضيفين ذوي الذاكرة المحدودة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## معيار كمون النموذج (مفاتيح محلية)

السكريبت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات البيئة الاختيارية: `MINIMAX_API_KEY` و`MINIMAX_BASE_URL` و`MINIMAX_MODEL` و`ANTHROPIC_API_KEY`
- المطالبة الافتراضية: "أجب بكلمة واحدة: ok. من دون علامات ترقيم أو نص إضافي."

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax median 1279ms ‏(الحد الأدنى 1114، الحد الأقصى 2431)
- opus median 2454ms ‏(الحد الأدنى 1224، الحد الأقصى 3170)

## معيار بدء CLI

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

الإعدادات المسبقة:

- `startup`: ‏`--version` و`--help` و`health` و`health --json` و`status --json` و`status`
- `real`: ‏`health` و`status` و`status --json` و`sessions` و`sessions --json` و`agents list --json` و`gateway status` و`gateway status --json` و`gateway health --json` و`config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الناتج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع رمز الخروج/الإشارة، وملخصات أقصى RSS لكل أمر. ويؤدي استخدام `--cpu-prof-dir` / `--heap-prof-dir` الاختياري إلى كتابة ملفات تعريف V8 لكل تشغيل حتى يستخدم التقاط التوقيت وملف التعريف التسخير نفسه.

اتفاقيات المخرجات المحفوظة:

- يكتب `pnpm test:startup:bench:smoke` عنصر smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` عنصر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف الأساس المعتمد في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المعتمد داخل المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E ‏(Docker)

يُعد Docker اختياريًا؛ ولا تكون هناك حاجة إليه إلا لاختبارات smoke الخاصة بتهيئة المستخدم داخل الحاويات.

تدفق بدء بارد كامل داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكريبت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## QR import smoke ‏(Docker)

يضمن أن مساعد بيئة تشغيل QR المُصان يُحمَّل ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار الحي](/ar/help/testing-live)

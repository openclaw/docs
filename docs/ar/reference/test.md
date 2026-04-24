---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي force وcoverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-24T08:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- مجموعة الاختبارات الكاملة (الأجنحة، وlive، وDocker): ‏[Testing](/ar/help/testing)

- `pnpm test:force`: ينهي أي عملية gateway متبقية تحتجز منفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ gateway معزول حتى لا تتصادم اختبارات الخادم مع مثيل قيد التشغيل. استخدمه عندما يترك تشغيل سابق لـ gateway المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة unit مع تغطية V8 ‏(عبر `vitest.unit.config.ts`). هذه بوابة تغطية unit للملفات المحمّلة، وليست تغطية كل الملفات على مستوى المستودع كله. العتبات هي 70% للأسطر/الدوال/التعليمات و55% للفروع. ولأن `coverage.all` تساوي false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية unit بدلًا من اعتبار كل ملف مصدر في المسارات المقسمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية unit فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة النطاق عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه. أما تغييرات التهيئة/الإعداد فتعود إلى تشغيل مشاريع الجذر الأصلية حتى تعيد تعديلات الربط تشغيل نطاق أوسع عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يطلقها الفرق مقارنةً بـ `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقارنةً بـ `origin/main`. وهو يشغّل العمل الأساسي مع مسارات الاختبار الأساسية، وعمل الامتدادات مع مسارات اختبار الامتدادات، والعمل الخاص بالاختبارات فقط مع typecheck/الاختبارات الخاصة بالاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو عقود plugin إلى تمريرة تحقق واحدة للامتدادات، ويحصر زيادات الإصدارات الخاصة ببيانات الإصدار فقط ضمن فحوصات الإصدار/التهيئة/اعتماديات الجذر المستهدفة.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. أما التشغيلات غير المستهدفة فتستخدم مجموعات shards ثابتة وتتوسع إلى تهيئات فرعية للتنفيذ المتوازي محليًا؛ وتتمدد مجموعة الامتدادات دائمًا إلى تهيئات shards لكل امتداد/Plugin بدلًا من عملية root-project عملاقة واحدة.
- تحدّث تشغيلات المجموعة الكاملة وshards الخاصة بالامتدادات بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة هذه التوقيتات لموازنة shards البطيئة والسريعة. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- تُوجَّه الآن ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تحتفظ فقط بـ `test/setup.ts`، وتبقي الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- كما تُربط ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` أيضًا مع `pnpm test:changed` باختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب التعديلات الصغيرة على المساعدات إعادة تشغيل المجموعات الثقيلة المدعومة ببيئة التشغيل.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاث تهيئات مخصصة (`core` و`top-level` و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرمز/المساعدات الأخف في المستوى الأعلى.
- تهيئة Vitest الأساسية تضبط الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغل المشترك غير المعزول عبر تهيئات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان جميع shards الخاصة بالامتدادات/Plugins. تعمل Channel Plugins الثقيلة وbrowser plugin وOpenAI كـ shards مخصصة؛ بينما تبقى مجموعات plugin الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل أداء الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقارنةً بتشغيل root-project الأصلي لنفس فرق git المثبّت.
- `pnpm test:perf:changed:bench -- --worktree` يقيس مجموعة تغييرات worktree الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف CPU profile للخيط الرئيسي لـ Vitest ‏(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات CPU + heap profiles لمشغّل unit ‏(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل تهيئة فرعية كاملة لـ Vitest تسلسليًا ويكتب بيانات المدة المجمعة بالإضافة إلى آثار JSON/السجل لكل تهيئة. ويستخدم Test Performance Agent هذا الملف كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- تكامل Gateway: تفعيل اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke الشاملة من طرف إلى طرف الخاصة بـ gateway ‏(إقران WS/HTTP/node متعدد المثيلات). يضبط افتراضيًا `threads` + `isolate: false` مع workers تكيفية في `vitest.e2e.config.ts`؛ ويمكن الضبط عبر `OPENCLAW_E2E_WORKERS=<n>` مع تعيين `OPENCLAW_E2E_VERBOSE=1` لسجلات مطولة.
- `pnpm test:live`: يشغّل اختبارات live الخاصة بالموفّرين (minimax/zai). ويتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاصة بالموفّر) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار live المشتركة وصورة Docker E2E مرة واحدة، ثم يشغّل مسارات Docker smoke مع `OPENCLAW_SKIP_DOCKER_BUILD=1` وبمستوى توازٍ 8 افتراضيًا. اضبط المجموعة الرئيسية عبر `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ومجموعة الذيل الحساسة للموفّر عبر `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`؛ وكلتاهما تساوي 8 افتراضيًا. يتوقف المشغّل عن جدولة مسارات مجمعة جديدة بعد أول فشل ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة 120 دقيقة يمكن تجاوزها عبر `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. وتُكتب سجلات كل مسار ضمن `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw وOpen WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل دردشة proxied حقيقية عبر `/api/chat/completions`. ويتطلب مفتاح نموذج live صالحًا (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس متوقعًا أن يكون مستقرًا في CI مثل مجموعات unit/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة البيانات وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. ويقرأ تحقق إشعارات Claude إطارات MCP الخام على stdio مباشرة حتى يعكس اختبار smoke ما يصدره الجسر فعليًا.

## بوابة PR المحلية

لفحوصات تمرير/بوابة PR المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا أظهر `pnpm test` سلوكًا متقلبًا على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزل المشكلة باستخدام `pnpm test <path/to/test>`. وبالنسبة إلى المضيفات ذات الذاكرة المحدودة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس كمون النموذج (مفاتيح محلية)

البرنامج النصي: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات بيئة اختيارية: `MINIMAX_API_KEY` و`MINIMAX_BASE_URL` و`MINIMAX_MODEL` و`ANTHROPIC_API_KEY`
- المطالبة الافتراضية: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- الوسيط لـ minimax هو 1279ms ‏(الحد الأدنى 1114، الحد الأقصى 2431)
- الوسيط لـ opus هو 2454ms ‏(الحد الأدنى 1224، الحد الأقصى 3170)

## قياس بدء تشغيل CLI

البرنامج النصي: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع exit-code/signal، وملخصات الحد الأقصى لـ RSS لكل أمر. ويؤدي `--cpu-prof-dir` / `--heap-prof-dir` الاختياريان إلى كتابة ملفات V8 profiles لكل تشغيل بحيث يستخدم جمع التوقيت والملفات التعريفية مجموعة القياس نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر smoke المستهدف إلى `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة إلى `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف baseline المثبت في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المثبت:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع الملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E ‏(Docker)

يعد Docker اختياريًا؛ وهذا مطلوب فقط لاختبارات smoke الخاصة بـ onboarding داخل الحاويات.

تدفق بدء تشغيل بارد كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا البرنامج النصي المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات التهيئة/مساحة العمل/الجلسة، ثم يبدأ gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR ‏(Docker)

يضمن أن مساعد وقت التشغيل الخاص بـ QR والذي تتم صيانته يُحمَّل ضمن بيئات Node المدعومة في Docker ‏(الافتراضي Node 24، والمتوافق Node 22):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [Testing](/ar/help/testing)
- [Testing live](/ar/help/testing-live)

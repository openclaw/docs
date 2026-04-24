---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (`vitest`) ومتى يجب استخدام وضعي `force` و`coverage`
title: الاختبارات
x-i18n:
    generated_at: "2026-04-24T09:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- مجموعة الاختبار الكاملة (الأجنحة، live، Docker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يوقف أي عملية Gateway عالقة تحتفظ بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتعارض اختبارات الخادم مع مثيل قيد التشغيل. استخدم هذا عندما تترك عملية Gateway سابقة المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدة مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية لوحدات الملفات المحمّلة، وليست تغطية لجميع الملفات على مستوى المستودع بالكامل. الحدود الدنيا هي 70% للأسطر/الدوال/التعليمات و55% للفروع. ولأن `coverage.all` مضبوط على false، فإن البوابة تقيس الملفات التي تحمّلها مجموعة تغطية الوحدة بدلًا من اعتبار كل ملف مصدر ضمن المسارات المقسمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية اختبارات الوحدة فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة النطاق عندما يقتصر الفرق على ملفات مصدر/اختبار قابلة للتوجيه. أما تغييرات الإعداد/التهيئة فتعود إلى تشغيل مشاريع الجذر الأصلية حتى تعيد تعديلات الربط التشغيل على نطاق أوسع عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقارنةً بـ `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقارنةً بـ `origin/main`. فهو يشغّل أعمال النواة مع مسارات اختبارات النواة، وأعمال الامتدادات مع مسارات اختبارات الامتدادات، والأعمال الخاصة بالاختبارات فقط مع فحص أنواع/اختبارات الاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو عقود plugin إلى مرور تحقق واحد للامتدادات، ويحافظ على زيادات الإصدار التي تقتصر على بيانات الإصدار الوصفية ضمن فحوصات مستهدفة للإصدار/الإعداد/اعتمادات الجذر.
- `pnpm test`: يوجّه أهداف الملفات/المجلدات الصريحة عبر مسارات Vitest محددة النطاق. أما التشغيلات غير المستهدفة فتستخدم مجموعات تجزئة ثابتة وتتوسع إلى إعدادات فرعية للتنفيذ المحلي المتوازي؛ وتتمدد مجموعة الامتدادات دائمًا إلى إعدادات التجزئة الخاصة بكل امتداد/plugin بدلًا من عملية مشروع جذر ضخمة واحدة.
- تشغيلات المجموعة الكاملة وتجزيئات الامتدادات تحدّث بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة هذه التوقيتات لموازنة التجزيئات البطيئة والسريعة. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل عنصر التوقيت المحلي.
- بعض ملفات اختبار `plugin-sdk` و`commands` المحددة تُوجَّه الآن عبر مسارات خفيفة مخصصة تُبقي فقط على `test/setup.ts`، وتترك الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- بعض ملفات المصدر المساعدة المحددة لـ `plugin-sdk` و`commands` تربط أيضًا `pnpm test:changed` باختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات الصغيرة إعادة تشغيل المجموعات الثقيلة المدعومة بوقت التشغيل.
- `auto-reply` ينقسم الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا يهيمن إطار reply على اختبارات الحالة/الرموز/المساعدات الأخف على المستوى الأعلى.
- إعداد Vitest الأساسي يستخدم الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغل المشترك غير المعزول عبر إعدادات المستودع.
- `pnpm test:channels` يشغّل `vitest.channels.config.ts`.
- `pnpm test:extensions` و`pnpm test extensions` يشغّلان جميع تجزيئات الامتدادات/plugins. تعمل plugins القنوات الثقيلة وplugin المتصفح وOpenAI كتجزيئات مخصصة؛ بينما تبقى مجموعات plugin الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيل الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/المجلدات الصريحة.
- `pnpm test:perf:imports:changed`: نفس قياس ملف الاستيراد، ولكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار الوضع المتغير الموجّه مقارنةً بتشغيل مشروع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي لـ Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغل الوحدة (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل إعداد فرعي لـ Vitest للمجموعة الكاملة بشكل تسلسلي ويكتب بيانات مدة مجمعة مع عناصر JSON/سجل لكل إعداد. يستخدم Test Performance Agent هذا كخط أساس قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمعة بعد تغيير يركز على الأداء.
- تكامل Gateway: تفعيل اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke الشاملة لـ Gateway (إقران WS/HTTP/Node متعدد المثيلات). يستخدم افتراضيًا `threads` + `isolate: false` مع عمال متكيفين في `vitest.e2e.config.ts`؛ اضبطه عبر `OPENCLAW_E2E_WORKERS=<n>` واضبط `OPENCLAW_E2E_VERBOSE=1` للحصول على سجلات مفصلة.
- `pnpm test:live`: يشغّل اختبارات providers الحية (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بكل provider) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة وصورة Docker E2E مرة واحدة، ثم يشغّل مسارات Docker smoke مع `OPENCLAW_SKIP_DOCKER_BUILD=1` وبمستوى توازٍ 8 افتراضيًا. اضبط التجمع الرئيسي عبر `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` وتجمع الذيل الحساس للـ provider عبر `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`؛ وكلاهما افتراضيًا 8. يتم إزاحة بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف الإنشاء في Docker daemon المحلي؛ ويمكن تجاوز ذلك عبر `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يتوقف المشغل عن جدولة مسارات مجمعة جديدة بعد أول فشل ما لم يتم ضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة 120 دقيقة قابلة للتجاوز عبر `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. تُكتب سجلات كل مسار ضمن `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw وOpen WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل محادثة حقيقية عبر الوكيل من خلال `/api/chat/completions`. يتطلب مفتاح نموذج حي صالحًا (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس من المتوقع أن يكون مستقرًا على مستوى CI مثل مجموعات الوحدة/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة مسبقًا وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio الحقيقي. يقرأ تحقق إشعارات Claude إطارات MCP الخام عبر stdio مباشرةً بحيث يعكس اختبار smoke ما يبثه الجسر فعليًا.

## بوابة PR المحلية

لإجراء فحوصات البوابة/الدمج المحلية لـ PR، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا كان `pnpm test` يتعثر على مضيف مثقل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. وللأجهزة ذات الذاكرة المحدودة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن استجابة النموذج (مفاتيح محلية)

البرنامج النصي: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات البيئة الاختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- المطالبة الافتراضية: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax بوسيط 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- opus بوسيط 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

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

- `startup`: ‏`--version`، ‏`--help`، ‏`health`، ‏`health --json`، ‏`status --json`، ‏`status`
- `real`: ‏`health`، ‏`status`، ‏`status --json`، ‏`sessions`، ‏`sessions --json`، ‏`agents list --json`، ‏`gateway status`، ‏`gateway status --json`، ‏`gateway health --json`، ‏`config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الإخراج `sampleCount` والمتوسط وp50 وp95 والحد الأدنى/الأقصى وتوزيع رموز الخروج/الإشارات وملخصات أقصى RSS لكل أمر. ويكتب `--cpu-prof-dir` / `--heap-prof-dir` الاختياريان ملفات تعريف V8 لكل تشغيل بحيث يستخدم قياس التوقيت والتقاط ملفات التعريف نفس إطار الاختبار.

اصطلاحات الإخراج المحفوظ:

- `pnpm test:startup:bench:smoke` يكتب عنصر smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` يكتب عنصر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- `pnpm test:startup:bench:update` يحدّث خط الأساس المثبت في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المثبت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه عبر `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع الملف عبر `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker اختياري؛ وهذا مطلوب فقط لاختبارات smoke الخاصة بالـ onboarding داخل الحاويات.

تدفق بدء تشغيل كامل من الصفر داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا البرنامج النصي المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات config/workspace/session، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR (Docker)

يضمن أن مساعد وقت تشغيل QR المُصان يتم تحميله تحت إصدارات Node المدعومة في Docker (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار الحي](/ar/help/testing-live)

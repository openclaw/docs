---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النماذج/الموفّرات
    - تصحيح سلوك البوابة + الوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-11T02:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55e75d056306a77b0d112a3902c08c7771f53533250847fc3d785b1df3e0e9e7
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration و e2e و live) ومجموعة صغيرة من مشغلات Docker.

هذا المستند هو دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي **لا** تغطيه عمدًا)
- الأوامر التي يجب تشغيلها لسيناريوهات العمل الشائعة (محليًا، قبل الدفع، التصحيح)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/الموفّرين
- كيفية إضافة اختبارات تراجعية للمشكلات الواقعية المتعلقة بالنماذج/الموفّرين

## بدء سريع

في معظم الأيام:

- البوابة الكاملة (المتوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات مباشرة يوجّه الآن أيضًا مسارات الإضافات/القنوات: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- يُفضّل تشغيل الاختبارات المستهدفة أولًا عندما تكون تكرّر العمل على فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح موفّرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (فحوصات النماذج + أدوات/صور البوابة): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، يُفضّل تضييق الاختبارات الحية باستخدام متغيرات بيئة قائمة السماح الموضحة أدناه.

## مشغلات خاصة بـ QA

توجد هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال بوابة معزولين،
    حتى 64 عاملًا أو بعدد السيناريوهات المحددة. استخدم
    `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` من أجل
    المسار التسلسلي الأقدم.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الموجود في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار الموفّر/النموذج نفسها التي يستخدمها `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA الحية المدعومة والعملية للضيف:
    مفاتيح الموفّر المعتمدة على env، ومسار إعداد موفّر QA الحي، و `CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج ضمن جذر المستودع حتى يتمكن الضيف من الكتابة
    مرة أخرى عبر مساحة العمل المركّبة.
  - يكتب تقرير QA المعتاد + الملخص إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي الخاص بـ Matrix مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - يوفّر ثلاثة مستخدمين مؤقتين في Matrix (`driver` و `sut` و `observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لبوابة QA باستخدام إضافة Matrix الحقيقية كناقل SUT.
  - يستخدم صورة Tuwunel المستقرة والمثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - يكتب تقرير QA لـ Matrix وملخصًا وملفًا للأحداث المرصودة تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي الخاص بـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوتات السائق و SUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يتطلب بوتين مختلفين في المجموعة الخاصة نفسها، مع كشف بوت SUT عن اسم مستخدم Telegram.
  - لمراقبة مستقرة بين البوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن بوت السائق يستطيع مراقبة حركة البوتات في المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصًا وملفًا للرسائل المرصودة تحت `.artifacts/qa-e2e/...`.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA اصطناعية واسعة وليس جزءًا من مصفوفة تغطية
وسائل النقل الحية.

| المسار | Canary | بوابة الإشارات | حظر قائمة السماح | رد المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة |
| ------ | ------ | -------------- | ---------------- | ------------------ | ------------------------- | --------------- | ------------ | ----------------- | ------------ |
| Matrix | x      | x              | x                | x                  | x                         | x               | x            | x                 |              |
| Telegram | x    |                |                  |                    |                           |                 |              |                   | x            |

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها "تزداد واقعية" (وكذلك تزداد قابلية العطل/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات shards متسلسلة (`vitest.full-*.config.ts`) عبر مشاريع Vitest المحددة الحالية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و `packages/**/*.test.ts` و `test/**/*.test.ts` واختبارات `ui` الخاصة بـ node المدرجة في القائمة المسموح بها والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات تكامل داخل العملية (مصادقة البوابة، التوجيه، الأدوات، التحليل، الإعداد)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن أحد عشر إعداد shard أصغر (`core-unit-src` و `core-unit-security` و `core-unit-ui` و `core-unit-support` و `core-support-boundary` و `core-contracts` و `core-bundled` و `core-runtime` و `agentic` و `auto-reply` و `extensions`) بدلًا من عملية جذر مشروع أصلية واحدة ضخمة. هذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/الإضافات من حرمان المجموعات غير المرتبطة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشروع الجذري الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الـ shards ليست عملية.
  - يوجّه `pnpm test` و `pnpm test:watch` و `pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات محددة أولًا، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب دفع كلفة بدء تشغيل المشروع الجذري الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى هذه المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ أما تعديلات الإعداد/التهيئة فتعود إلى إعادة التشغيل الواسعة لمشروع الجذر.
  - يتم توجيه اختبارات unit الخفيفة الاستيراد من الوكلاء والأوامر والإضافات ومساعدات auto-reply و `plugin-sdk` والمناطق المساعدة النقية المشابهة عبر مسار `unit-fast` الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ أما الملفات ذات الحالة/الثقيلة على مستوى بيئة التشغيل فتبقى على المسارات الحالية.
  - يتم أيضًا ربط بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و `commands` في وضع التغيير باختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - يحتوي `auto-reply` الآن على ثلاث حزم مخصصة: مساعدات core عالية المستوى، واختبارات تكامل `reply.*` عالية المستوى، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يبقي أثقل أعمال حزمة الرد خارج اختبارات الحالة/المقاطع/الرموز الأرخص.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق بيئة تشغيل الضغط،
    حافظ على مستويي التغطية معًا.
  - أضف اختبارات تراجعية مركّزة للمساعد عند حدود التوجيه/التطبيع الخالصة.
  - وحافظ أيضًا على سلامة مجموعات تكامل المشغّل المضمّن:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المحددة وسلوك الضغط لا يزالان يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات المساعد وحدها
    بديلًا كافيًا عن مسارات التكامل هذه.
- ملاحظة الـ pool:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - كما يثبّت إعداد Vitest المشترك أيضًا `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وإعدادات e2e و live.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - يرث كل shard ضمن `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` افتراضيًا إلى عمليات Node الفرعية الخاصة بـ Vitest لتقليل تقلبات ترجمة V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت بحاجة إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يوجّه `pnpm test:changed` عبر مسارات محددة عندما ترتبط المسارات المتغيرة بشكل واضح بمجموعة أصغر.
  - يحتفظ `pnpm test:max` و `pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى للعمّال.
  - أصبح التوسّع التلقائي لعدد العمّال محليًا متحفّظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تُحدث تشغيلات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
  - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعداد على أنها `forceRerunTriggers` حتى تظل إعادة التشغيل في وضع التغيير صحيحة عندما يتغير توصيل الاختبار.
  - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع cache صريحًا واحدًا للتوصيف المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التوصيف نفسه بالملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق الملتزم ويطبع زمن الجدار إضافة إلى RSS الأقصى على macOS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة خلال `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف توصيف CPU للخيط الرئيسي لتكاليف بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات توصيف CPU+heap للمشغّل لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### E2E (اختبار دخان البوابة)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- القيم الافتراضية لبيئة التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة I/O الخاصة بوحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك البوابة متعددة النسخ من طرف إلى طرف
  - أسطح WebSocket/HTTP، واقتران العقد، والشبكات الأثقل
- التوقعات:
  - تعمل في CI (عندما تكون مفعّلة في خط الأنابيب)
  - لا تتطلب مفاتيح حقيقية
  - تحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد تكون أبطأ)

### E2E: اختبار دخان الواجهة الخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ بوابة OpenShell معزولة على المضيف عبر Docker
  - ينشئ صندوق حماية من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية OpenShell في OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقي
  - يتحقق من سلوك نظام الملفات canonical عن بُعد عبر جسر fs في صندوق الحماية
- التوقعات:
  - اختيارية فقط؛ ليست جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - تتطلب CLI محليًا لـ `openshell` إضافة إلى daemon Docker يعمل
  - تستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم تدمّر بوابة الاختبار وصندوق الحماية
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو script مغلّف

### Live (موفّرون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا الموفّر/النموذج فعلًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - اكتشاف تغييرات تنسيق الموفّر، وسلوكيات استدعاء الأدوات غير المعتادة، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقرة في CI بطبيعتها (شبكات حقيقية، وسياسات موفّرين حقيقية، وحصص، وأعطال)
  - تكلّف مالًا / تستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية مضيّقة بدلًا من تشغيل "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية مجلد المنزل الحقيقي لديك.
- أصبح `pnpm test:live` افتراضيًا الآن في وضع أكثر هدوءًا: فهو يحتفظ بمخرجات التقدّم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع البوابة/ضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل موفّر): اضبط `*_API_KEYS` بتنسيق الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1` و `*_API_KEY_2` (مثل `OPENAI_API_KEYS` و `ANTHROPIC_API_KEYS` و `GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدّم/نبضات الحياة:
  - تصدر المجموعات الحية الآن أسطر التقدّم إلى stderr بحيث تظل استدعاءات الموفّرين الطويلة مرئية النشاط حتى عندما يكون التقاط وحدة التحكم في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest حتى يتم بث أسطر تقدّم الموفّر/البوابة فورًا أثناء التشغيلات الحية.
  - اضبط نبضات الحياة للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط نبضات الحياة للبوابة/الفحوصات باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و `pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات البوابة / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "البوت الخاص بي متوقف" / أعطال خاصة بموفّر / استدعاء الأدوات: شغّل `pnpm test:live` بشكل مضيّق

## Live: مسح قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر يتم الإعلان عنه حاليًا** بواسطة عقدة Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد يدوي/مشروط مسبقًا (لا تقوم المجموعة بتثبيت التطبيق أو تشغيله أو إقرانه).
  - التحقق من `node.invoke` في البوابة أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل بالبوابة.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/الموافقة على الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار دخان النماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الأعطال:

- تخبرنا "النماذج المباشرة" ما إذا كان الموفّر/النموذج قادرًا على الرد أصلًا باستخدام المفتاح المعطى.
- يخبرنا "اختبار دخان البوابة" ما إذا كان مسار البوابة+الوكيل الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة صندوق الحماية، وما إلى ذلك).

### الطبقة 1: إكمال نموذج مباشر (من دون بوابة)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها للحفاظ على تركيز `pnpm test:live` على اختبار دخان البوابة
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، و GPT-5.x + Codex، و Gemini 3، و GLM 4.7، و MiniMax M2.7، و Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا للحصول على حد أصغر.
- كيفية اختيار الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - فصل "واجهة API الخاصة بالموفّر معطلة / المفتاح غير صالح" عن "مسار وكيل البوابة معطل"
  - احتواء اختبارات تراجعية صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال + تدفقات استدعاء الأدوات الخاصة بـ OpenAI Responses/Codex Responses)

### الطبقة 2: اختبار دخان البوابة + وكيل التطوير (ما الذي يفعله "@openclaw" فعلًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل بوابة داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - تكرار النماذج التي تملك مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (فحص read)
    - فحوصات أدوات إضافية اختيارية (فحص exec+read)
    - استمرار عمل مسارات الانحدار الخاصة بـ OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل الفحوصات (حتى تتمكن من شرح الأعطال بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت ثم قراءته مجددًا عبر `read`.
  - فحص الصور: يرفق الاختبار PNG مُولّدًا (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، و GPT-5.x + Codex، و Gemini 3، و GLM 4.7، و MiniMax M2.7، و Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح البوابة modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا للحصول على حد أصغر.
- كيفية اختيار الموفّرين (لتجنب "كل شيء في OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- فحوصات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (ضغط على الأدوات)
  - يعمل فحص الصور عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار PNG صغيرًا مع "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` مع `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - تحلل البوابة المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرّر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (تحمّل OCR: يُسمح بأخطاء طفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار دخان الواجهة الخلفية لـ CLI (Claude أو Codex أو Gemini أو واجهات CLI محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار البوابة + الوكيل باستخدام واجهة CLI خلفية محلية، من دون لمس إعدادك الافتراضي.
- توجد القيم الافتراضية لاختبار الدخان الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - الموفّر/النموذج الافتراضيان: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات التعريف الخاصة بإضافة الواجهة الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (يتم حقن المسارات في المطالبة).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عندما يتم تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال جولة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي داخل الجلسة نفسها من Claude Sonnet إلى Opus (اضبطه إلى `1` لفرض تشغيله عندما يدعم النموذج المحدد هدف تبديل).

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفّر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل اختبار الدخان الحي للواجهة الخلفية CLI داخل صورة Docker الخاصة بالمستودع بوصفه المستخدم غير الجذر `node`.
- يحلّل بيانات تعريف اختبار الدخان للواجهة CLI من الامتداد المالك، ثم يثبّت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code من خلال `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا عمل `claude -p` المباشر داخل Docker، ثم يشغّل جولتين لواجهة CLI الخلفية في البوابة من دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. يعطّل هذا المسار الخاص بالاشتراك افتراضيًا فحوصات Claude MCP/tool والصور لأن Claude يوجّه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافي بدلًا من حدود خطة الاشتراك العادية.
- أصبح اختبار الدخان الحي للواجهة الخلفية CLI الآن يختبر التدفق الكامل نفسه من طرف إلى طرف لكل من Claude و Codex و Gemini: جولة نصية، ثم جولة تصنيف صور، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر CLI البوابة.
- يقوم اختبار الدخان الافتراضي لـ Claude أيضًا بتصحيح الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## Live: اختبار دخان ACP bind (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي لـ ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة اصطناعية لقناة رسائل في مكانها
  - إرسال متابعة عادية على نفس تلك المحادثة
  - التحقق من أن المتابعة تصل إلى سجل الجلسة المرتبطة في ACP
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر عبر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة على نمط الرسائل المباشرة في Slack
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح البوابة `chat.send` مع حقول originating-route اصطناعية خاصة بالمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون الادعاء بأنها تُسلَّم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في إضافة `acpx` المضمّنة للوكيل المحدد في حزمة ACP.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-acp-bind
```

وصفات Docker لوكيل واحد:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغّل اختبار ACP bind smoke مقابل جميع وكلاء CLI الحية المدعومة بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت واجهة CLI الحية المطلوبة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كانت مفقودة.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات env الخاصة بالموفّر من الملف الشخصي المستورد متاحة لواجهة CLI الفرعية في الحزمة.

## Live: اختبار دخان حزمة Codex app-server

- الهدف: التحقق من الحزمة المملوكة للإضافة الخاصة بـ Codex عبر
  طريقة البوابة `agent` العادية:
  - تحميل إضافة `codex` المضمّنة
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول جولة لوكيل البوابة إلى `codex/gpt-5.4`
  - إرسال جولة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة
    app-server تستطيع الاستئناف
  - تشغيل `/codex status` و `/codex models` عبر مسار أوامر البوابة نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط اختبار smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` بحيث لا يمكن
  لحزمة Codex المعطلة أن تمر عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية من
  `~/.codex/auth.json` و `~/.codex/config.toml`

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يستورد `~/.profile` المركّب، ويمرّر `OPENAI_API_KEY`، وينسخ ملفات
  مصادقة Codex CLI عند وجودها، ويثبت `@openai/codex` في بادئة npm
  قابلة للكتابة ومركّبة، ويجهّز شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker فحوصات الصور و MCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد الاختبار
  الحي بحيث لا يتمكن `openai-codex/*` أو الرجوع إلى PI من إخفاء
  انحدار في حزمة Codex.

### وصفات حية موصى بها

تُعد قوائم السماح الضيقة والصريحة الأسرع والأقل عرضة للأعطال:

- نموذج واحد، مباشر (من دون بوابة):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار دخان البوابة:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة موفّرين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز على Google (مفتاح API لـ Gemini + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلية على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / الملف الشخصي)؛ وهذا ما يقصده معظم المستخدمين عندما يقولون "Gemini".
  - CLI: يقوم OpenClaw بتنفيذ ملف `gemini` ثنائي محليًا؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدار).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (لأن live اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يستمر في العمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (تجنّب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار دخان البوابة مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة موفّر:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يملك قدرة على "الأدوات" ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال الصور (مرفق ← رسالة متعددة الوسائط)

أدرج نموذجًا واحدًا على الأقل قادرًا على معالجة الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/OpenAI بالإصدارات الداعمة للرؤية، وما إلى ذلك) لتفعيل فحص الصور.

### المجمّعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعّلة، فإننا ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على المرشحين القادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و `opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

موفّرون إضافيون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات الاعتماد/الإعداد):

- مضمّنة: `openai` و `openai-codex` و `anthropic` و `google` و `google-vertex` و `google-antigravity` و `google-gemini-cli` و `zai` و `openrouter` و `opencode` و `opencode-go` و `xai` و `groq` و `cerebras` و `mistral` و `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (مثل LM Studio و vLLM و LiteLLM وغيرها)

نصيحة: لا تحاول ترميز "كل النماذج" بشكل ثابت في المستندات. القائمة المرجعية هي ببساطة ما تعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. الآثار العملية:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي تصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه "مفاتيح الملف الشخصي" في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يتم نسخه إلى المنزل الحي المجهّز عند وجوده، لكنه ليس مخزن مفاتيح الملفات الشخصية الرئيسي)
- تنسخ التشغيلات الحية المحلية افتراضيًا الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و `credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت؛ وتتجاوز المنازل الحية المجهّزة `workspace/` و `sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` و `agentDir` حتى تبقى الفحوصات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env (مثل تلك التي تُصدَّر في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (نسخ الصوت)

- الاختبار: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `src/agents/byteplus.live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر المسارات المضمّنة الخاصة بـ comfy للصور والفيديو و `music_generate`
  - يتخطى كل قدرة ما لم يتم إعداد `models.providers.comfy.<capability>`
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستطلاع أو التنزيلات أو تسجيل الإضافة

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- الحزمة: `pnpm test:live:media image`
- النطاق:
  - يُعدّد كل إضافة موفّر لتوليد الصور مسجّلة
  - يحمّل متغيرات env الناقصة الخاصة بالموفّر من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة بيئة التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- الموفّرون المضمّنون الحاليون المشمولون:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن الملفات الشخصية وتجاهل التجاوزات القادمة من env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار موفّر توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google و MiniMax
  - يحمّل متغيرات env الخاصة بالموفّر من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل وضعي بيئة التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على المطالبة فقط
    - `edit` عندما يعلن الموفّر `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس ضمن هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن الملفات الشخصية وتجاهل التجاوزات القادمة من env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار موفّر توليد الفيديو المضمّن المشترك
  - يحمّل متغيرات env الخاصة بالموفّر من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل وضعي بيئة التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على المطالبة فقط
    - `imageToVideo` عندما يعلن الموفّر `capabilities.imageToVideo.enabled` ويقبل الموفّر/النموذج المحدد إدخال الصور المحلية المدعوم بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن الموفّر `capabilities.videoToVideo.enabled` ويقبل الموفّر/النموذج المحدد إدخال الفيديو المحلي المدعوم بالمخزن المؤقت في المسح المشترك
  - موفّرو `imageToVideo` الحاليون المعلَن عنهم لكن المتخطَّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و `kling` المضمّن يتطلب عنوان URL بعيدًا للصورة
  - تغطية Vydra الخاصة بالموفّر:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تجهيز عنوان URL بعيد للصورة افتراضيًا
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - موفّرو `videoToVideo` الحاليون المعلَن عنهم لكن المتخطَّون في المسح المشترك:
    - `alibaba` و `qwen` و `xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لعمليات inpaint/remix الخاصة بالفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن الملفات الشخصية وتجاهل التجاوزات القادمة من env فقط

## حزمة الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول واحدة أصلية في المستودع
  - يحمّل تلقائيًا متغيرات env الناقصة الخاصة بالموفّر من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى الموفّرين الذين يملكون حاليًا مصادقة صالحة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك نبضات الحياة والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغلات Docker (اختيارية لفحوصات "يعمل في Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و `test:docker:live-gateway` فقط ملف الاختبار الحي المطابق الخاص بمفاتيح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا تم تركيبه). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و `test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حد smoke أصغر حتى يظل المسح الكامل في Docker عمليًا:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويضبط
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغلات smoke الخاصة بالحاويات: تقوم `test:docker:openwebui` و `test:docker:onboard` و `test:docker:gateway-network` و `test:docker:mcp-channels` و `test:docker:plugins` بإقلاع حاوية واحدة أو أكثر حقيقية والتحقق من مسارات تكامل أعلى مستوى.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية بتركيب أدلة مصادقة CLI المطلوبة فقط (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بواجهة CLI الخارجية من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- البوابة + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، تهيئة كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات البوابة (حاويتان، مصادقة WS + السلامة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (بوابة مزروعة + جسر stdio + smoke خام لإطارات إشعارات Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- الإضافات (install smoke + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)

كما تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
وتجهيزها داخل دليل عمل مؤقت داخل الحاوية. هذا يُبقي صورة بيئة التشغيل
نحيفة مع الاستمرار في تشغيل Vitest مقابل المصدر/الإعداد المحليين لديك بدقة.
وتتجاوز خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store` و `.worktrees` و `__openclaw_vitest__` وأدلة `.build` أو
مخرجات Gradle المحلية للتطبيق حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
عناصر خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات البوابة الحية
عمّال قنوات حقيقيين مثل Telegram و Discord وغيرها داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية البوابة
الحية من مسار Docker هذا.
ويُعد `test:docker:openwebui` اختبار smoke للتوافق على مستوى أعلى: فهو يبدأ
حاوية بوابة OpenClaw مع تفعيل نقاط النهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة مقابل تلك البوابة، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف عن `openclaw/default`، ثم يرسل
طلب محادثة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
وقد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد تحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص بها.
ويتوقع هذا المسار مفتاح نموذج حي صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في تشغيلات Docker.
وتطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
أما `test:docker:mcp-channels` فهو حتمي عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية بوابة
مزروعة، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة السجلات، وبيانات تعريف المرفقات،
وسلوك قائمة الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات على طريقة Claude عبر جسر MCP حقيقي قائم على stdio. ويفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة حتى يتحقق smoke مما يصدره
الجسر فعليًا، لا فقط ما قد تكشفه مجموعة SDK معينة لعميل ما.

اختبار smoke يدوي لخيوط ACP باللغة العادية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالاختبارات التراجعية/التصحيح. فقد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يتم تركيبه إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يتم تركيبه إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يتم تركيبه إلى `/home/node/.profile` ويتم استيراده قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يتم تركيبه إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- يتم تركيب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و `~/.codex/config.toml` و `.claude.json` و `~/.claude/.credentials.json` و `~/.claude/settings.json` و `~/.claude/settings.local.json`
  - تقوم تشغيلات الموفّرين المضيّقة بتركيب الأدلة/الملفات المطلوبة فقط كما يُستدل عليها من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - يمكنك التجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية الموفّرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لعمليات إعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن الملفات الشخصية (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي تكشفه البوابة لاختبار Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة التحقق من nonce المستخدمة بواسطة اختبار Open WebUI smoke
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديل المستندات: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط/مرابط Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال (آمن لـ CI)

هذه اختبارات تراجعية لـ "المسار الحقيقي" من دون موفّرين حقيقيين:

- استدعاء أدوات البوابة (OpenAI وهمي، وبوابة حقيقية + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج البوابة (WS `wizard.start`/`wizard.next`، يكتب config + auth enforced): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر البوابة الحقيقية + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج من طرف إلى طرف تتحقق من توصيل الجلسات وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا بالنسبة إلى Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الجولات تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود صندوق الحماية.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّرين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدم مقابل تجنّب، البوابات، حقن المطالبات).
- تقييمات حية اختيارية (اختيارية ومقيدة بـ env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل الإضافة والقناة)

تتحقق اختبارات العقود من أن كل إضافة وقناة مسجلة تتوافق مع
عقد الواجهة الخاص بها. فهي تكرّر على جميع الإضافات المكتشفة وتشغّل مجموعة من
التحققات المتعلقة بالشكل والسلوك. ويتخطى مسار unit الافتراضي في `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالوصلات وملفات smoke؛ شغّل أوامر العقود صراحةً
عندما تلمس الأسطح المشتركة للقنوات أو الموفّرين.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفّرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للإضافة (id، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف السلسلة
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعات

### عقود حالة الموفّر

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل الإضافة

### عقود الموفّر

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API فهرس النماذج
- **discovery** - اكتشاف الإضافة
- **loader** - تحميل الإضافة
- **runtime** - بيئة تشغيل الموفّر
- **shape** - شكل/واجهة الإضافة
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات أو مسارات فرعية لـ plugin-sdk
- بعد إضافة أو تعديل إضافة قناة أو موفّر
- بعد إعادة هيكلة تسجيل الإضافات أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة في موفّر/نموذج تم اكتشافها في live:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (موفّر وهمي/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب الموفّر → اختبار نماذج مباشر
  - خطأ في مسار جلسة/سجل/أدوات البوابة → اختبار دخان حي للبوابة أو اختبار بوابة وهمي وآمن لـ CI
- حاجز الحماية لاجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف `includeInPlan` جديدة لـ SecretRef في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يتم تخطي الفئات الجديدة بصمت.

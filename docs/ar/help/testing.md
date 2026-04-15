---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway والوكيل
summary: 'مجموعة الاختبارات: مجموعات unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-15T14:40:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec3632cafa1f38b27510372391b84af744266df96c58f7fac98aa03763465db8
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration، وe2e، وlive) ومجموعة صغيرة من مشغلات Docker.

هذا المستند هو دليل «كيف نختبر»:

- ما الذي تغطيه كل مجموعة (وما الذي لا تغطيه عمدًا)
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، وتصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات تراجعية لمشكلات حقيقية في النموذج/المزوّد

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز ذي موارد كافية: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجّه الآن أيضًا مسارات الإضافات/القنوات: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكون تعمل على تكرار إصلاح فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تعدّل الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوصات أدوات/صور Gateway): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، فالأفضل تضييق الاختبارات الحية باستخدام متغيرات بيئة قائمة السماح الموصوفة أدناه.

## المشغلات الخاصة بـ QA

توجد هذه الأوامر إلى جانب مجموعات الاختبار الأساسية عندما تحتاج إلى واقعية QA-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين، حتى 64 عاملًا أو عدد السيناريوهات المحدد. استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - التشغيلات الحية تمرّر مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة المخرجات تحت جذر المستودع حتى يتمكن الضيف من الكتابة للخلف عبر مساحة العمل المركّبة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA على نمط المشغّل.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - هذا المضيف الخاص بـ QA مخصص حاليًا للتطوير/المستودع فقط. تثبيتات OpenClaw المعبأة لا تشحن `qa-lab`، لذلك لا توفّر `openclaw qa`.
  - نُسخ المستودع تحمّل المشغّل المضمّن مباشرة؛ لا حاجة إلى خطوة تثبيت Plugin منفصلة.
  - يجهّز ثلاثة مستخدمي Matrix مؤقتين (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ تابع QA لـ Gateway باستخدام Plugin Matrix الحقيقي كوسيلة نقل SUT.
  - يستخدم صورة Tuwunel الثابتة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يوفّر Matrix أعلام مصادر بيانات اعتماد مشتركة لأن هذا المسار يجهّز مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA وملخصًا وartifact للأحداث المرصودة ضمن `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود الإيجار المجمّعة.
  - يتطلب botين مختلفين داخل المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT لاسم مستخدم Telegram.
  - لضمان مراقبة مستقرة بين bot وآخر، فعّل وضع التواصل بين الـ botات Bot-to-Bot Communication Mode في `@BotFather` لكلا botين، وتأكد من أن bot الخاص بـ driver يمكنه مراقبة حركة botات المجموعة.
  - يكتب تقرير Telegram QA وملخصًا وartifact للرسائل المرصودة ضمن `.artifacts/qa-e2e/...`.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار | Canary | بوابة الإشارة | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | مراقبة التفاعلات | أمر المساعدة |
| ------- | ------ | -------------- | ----------------- | --------------------- | -------------------------- | ------------- | ---------- | ----------------- | ------------ |
| Matrix   | x      | x              | x                 | x                     | x                          | x             | x          | x                 |              |
| Telegram | x      |                |                   |                       |                            |               |            |                   | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على عقد إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك العقد أثناء تشغيل المسار، ويحرّر العقد عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الافتراضي عبر env: `OPENCLAW_QA_CREDENTIAL_ROLE` (القيمة الافتراضية `maintainer`)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين Convex من نوع `http://` على loopback فقط للتطوير المحلي.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‎`https://`‎ في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - نفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /admin/add` (سر maintainer فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر maintainer فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حماية العقد النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

صيغة الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة تمثل معرّف دردشة Telegram رقميًا.
- يتحقق `admin/add` من هذه الصيغة عند `kind: "telegram"` ويرفض الحمولة غير الصحيحة.

### إضافة قناة إلى QA

إضافة قناة إلى نظام QA المعتمد على Markdown تتطلب أمرين فقط بالضبط:

1. مُهايئ نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أوامر QA جديدًا من المستوى الأعلى عندما يمكن للمضيف المشترك `qa-lab`
امتلاك هذا التدفق.

يتولى `qa-lab` آليات المضيف المشتركة:

- جذر أوامر `openclaw qa`
- بدء المجموعة وإنهاؤها
- توازي العمال
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- الأسماء المستعارة التوافقية لسيناريوهات `qa-channel` الأقدم

تمتلك إضافات المشغلات عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية إعداد Gateway لهذا النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النصوص المنسوخة transcript وحالة النقل المعيارية
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة التعيين أو التنظيف الخاص بالنقل

الحد الأدنى المطلوب لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ مشغّل النقل على واجهة مضيف `qa-lab` المشتركة.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة القناة الاختبارية.
4. تركيب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب أن تعلن إضافات المشغلات `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ يجب أن تبقى عمليات CLI والمشغّل الكسولة خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت `qa/scenarios/`.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء الأسماء المستعارة التوافقية الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة داخل `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه داخل Plugin ذلك المشغّل أو حزمة Plugin الخاصة به.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

الأسماء المفضلة للمساعدات العامة للسيناريوهات الجديدة هي:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

تبقى الأسماء المستعارة التوافقية متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
الأسماء المستعارة التوافقية موجودة لتجنب ترحيل شامل في يوم واحد، وليست النموذج
المقصود لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات باعتبارها «تزايدًا في الواقعية» (وتزايدًا في القابلية للتعطل/الكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات shard متسلسلة (`vitest.full-*.config.ts`) عبر مشاريع Vitest المحددة الحالية
- الملفات: قوائم core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` الخاصة بـ node والمسموح بها والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات تكامل داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - أصبح `pnpm test` غير المستهدف يشغّل الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية root-project أصلية واحدة ضخمة. هذا يقلل ذروة RSS على الأجهزة المحمّلة ويتجنب أن تتسبب أعمال auto-reply/extension في تجويع المجموعات غير المرتبطة.
  - ما يزال `pnpm test --watch` يستخدم مخطط المشاريع الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الـ shard غير عملية.
  - تقوم `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` بتوجيه أهداف الملفات/الأدلة الصريحة عبر المسارات المحددة أولًا، لذلك فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء root project الكامل.
  - يقوم `pnpm test:changed` بتوسيع مسارات git المتغيرة إلى هذه المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات source/test القابلة للتوجيه؛ أما تعديلات config/setup فترجع إلى إعادة التشغيل الواسعة لـ root-project.
  - يتم توجيه اختبارات unit الخفيفة الاستيراد من agents وcommands وplugins ومساعدات auto-reply و`plugin-sdk` ومناطق الأدوات الخالصة المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
  - تقوم أيضًا ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` بربط تشغيلات وضع changed باختبارات sibling الصريحة في تلك المسارات الخفيفة، حتى تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاث حاويات مخصصة: مساعدات core من المستوى الأعلى، واختبارات تكامل `reply.*` من المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يُبقي أعمال reply harness الأثقل بعيدة عن اختبارات status/chunk/token الرخيصة.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت التشغيل الخاص بـ Compaction،
    حافظ على مستويي التغطية كليهما.
  - أضف اختبارات تراجعية مركزة للمساعدات لحدود التوجيه/التطبيع الخالصة.
  - واصل أيضًا الحفاظ على سلامة مجموعات تكامل المشغّل المضمّن:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المحددة وسلوك Compaction ما زالا يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات المساعدات وحدها
    بديلًا كافيًا عن مسارات التكامل هذه.
- ملاحظة الـ pool:
  - أصبح الإعداد الأساسي لـ Vitest يستخدم `threads` افتراضيًا.
  - كما يثبّت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع root وe2e وlive.
  - يحافظ مسار UI الجذري على إعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - يرث كل shard من `pnpm test` افتراضيات `threads` + `isolate: false` نفسها من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` افتراضيًا لعمليات Node الفرعية الخاصة بـ Vitest لتقليل تقلبات الترجمة في V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يوجّه `pnpm test:changed` عبر المسارات المحددة عندما تربط المسارات المتغيرة بشكل نظيف إلى مجموعة أصغر.
  - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه، فقط مع حد أعلى للعمال.
  - أصبح التوسيع التلقائي المحلي للعمال محافظًا عمدًا الآن، كما يتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
  - يعلّم الإعداد الأساسي لـ Vitest ملفات المشاريع/config كـ `forceRerunTriggers` حتى تبقى إعادة تشغيل وضع changed صحيحة عندما يتغير ربط الاختبارات.
  - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع cache صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه ومسار root-project الأصلي لذلك الفرق الملتزم ويطبع وقت التنفيذ بالإضافة إلى macOS max RSS.
- يختبر `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة خلال `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف بدء Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### E2E (اختبار smoke لـ gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يتطابق مع بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة I/O في وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات وحدة التحكم المفصلة.
- النطاق:
  - سلوك gateway من طرف إلى طرف متعدد النسخ
  - أسطح WebSocket/HTTP، واقتران node، وشبكات أثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في المسار)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار smoke للواجهة الخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية OpenShell في OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقيين
  - يتحقق من سلوك نظام الملفات canonical-البعيد عبر جسر sandbox fs
- التوقعات:
  - اشتراك اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر test gateway وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى CLI binary غير افتراضي أو wrapper script

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ مع بيانات اعتماد حقيقية؟»
  - التقاط تغيرات تنسيق المزوّد، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI بطبيعته (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضَّل تشغيل مجموعات فرعية مضيقة بدلًا من «كل شيء»
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى home اختباري مؤقت حتى لا تتمكن fixtures الخاصة باختبارات unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا أن تستخدم الاختبارات الحية دليل home الحقيقي لديك.
- أصبح `pnpm test:live` يستخدم وضعًا أكثر هدوءًا افتراضيًا: فهو يبقي مخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت سجلات بدء التشغيل الكاملة من جديد.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بصيغة comma/semicolon أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات rate limit.
- مخرجات التقدم/Heartbeat:
  - تُصدر المجموعات الحية الآن أسطر التقدم إلى stderr حتى تظهر مكالمات المزوّد الطويلة على أنها نشطة بصريًا حتى عندما يكون التقاط وحدة التحكم في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest حتى تتدفق أسطر تقدم المزوّد/gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر عبر `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ gateway/probe عبر `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح «البوت الخاص بي متوقف» / الإخفاقات الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` على مجموعة فرعية مضيقة

## Live: مسح قدرات Android node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** من Android node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (المجموعة لا تثبّت التطبيق ولا تشغّله ولا تقترنه).
  - تحقق `node.invoke` على مستوى gateway لكل أمر بالنسبة إلى Android node المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل مع gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع أن تنجح.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار smoke للنموذج (مفاتيح profile)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- «النموذج المباشر» يخبرنا ما إذا كان المزوّد/النموذج قادرًا على الرد أصلًا باستخدام المفتاح المعطى.
- «اختبار smoke لـ Gateway» يخبرنا ما إذا كان خط gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي تتوفر لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم مستعار لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها للحفاظ على تركيز `pnpm test:live` على اختبار smoke لـ gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+ وGPT-5.x + Codex وGemini 3 وGLM 4.7 وMiniMax M2.7 وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: من مخزن profile وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profile** فقط
- سبب وجود هذا:
  - يفصل بين «واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح» و«خط gateway agent معطل»
  - يحتوي اختبارات تراجعية صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses reasoning replay + تدفقات tool-call)

### الطبقة 2: اختبار smoke لـ Gateway + وكيل التطوير (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/تعديل جلسة `agent:dev:*` (مع تجاوز النموذج في كل تشغيل)
  - التكرار عبر النماذج التي لها مفاتيح والتحقق من:
    - استجابة «ذات معنى» (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (فحص `read`)
    - فحوصات أدوات إضافية اختيارية (فحص `exec+read`)
    - استمرار عمل مسارات OpenAI التراجعية (tool-call-only → follow-up)
- تفاصيل الفحص (حتى تتمكن من شرح الإخفاقات بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل أن `read` الملف ويعيد nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce في ملف مؤقت باستخدام `exec`، ثم `read` له مرة أخرى.
  - فحص الصورة: يرفق الاختبار ملف PNG مُولّدًا (قطة + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+ وGPT-5.x + Codex وGemini 3 وGLM 4.7 وMiniMax M2.7 وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح gateway من نوع modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب «كل ما في OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون فحوصات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (ضغط الأدوات)
  - يعمل فحص الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (مع تساهل OCR: يُسمح بأخطاء طفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار smoke للواجهة الخلفية CLI (Claude أو Codex أو Gemini أو CLIات محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس إعدادك الافتراضي.
- توجد افتراضيات smoke الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالإضافة المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات Plugin metadata الخاصة بالواجهة الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي للجلسة نفسها من Claude Sonnet -> Opus (اضبطه إلى `1` لفرض تشغيله عندما يدعم النموذج المحدد هدف تبديل).

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

وصفات Docker لمزوّد واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل اختبار smoke الحي للواجهة الخلفية CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحلّ بيانات smoke metadata الخاصة بـ CLI من الإضافة المالكة، ثم يثبّت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخبأة مؤقتًا ضمن `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` مباشرة داخل Docker، ثم يشغّل دورتين لواجهة Gateway الخلفية CLI من دون الحفاظ على متغيرات env الخاصة بمفاتيح Anthropic API. يعطّل هذا المسار الخاص بالاشتراك فحوصات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- أصبح اختبار smoke الحي للواجهة الخلفية CLI يختبر الآن التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر CLI الخاص بـ gateway.
- يقوم اختبار smoke الافتراضي لـ Claude أيضًا بتعديل الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: اختبار smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP باستخدام وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة اصطناعية لقناة رسائل في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى transcript الجلسة المرتبطة في ACP
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الافتراضيات:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لتشغيل `pnpm test:live ...` مباشرة: `claude`
  - القناة الاصطناعية: سياق محادثة على نمط Slack DM
  - الواجهة الخلفية ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح gateway `chat.send` مع حقول originating-route اصطناعية مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` المحدد لوكيل حزمة ACP الاختبارية.

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
- افتراضيًا، يشغّل اختبار smoke الخاص بربط ACP على جميع وكلاء CLI الحيين المدعومين بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبّت `acpx` في بادئة npm قابلة للكتابة، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` حتى يحتفظ acpx بمتغيرات env الخاصة بالمزوّد من profile المستورَد متاحة لـ CLI التابع في الحزمة الاختبارية.

## Live: اختبار smoke لحزمة Codex app-server

- الهدف: التحقق من حزمة Codex المملوكة للإضافة عبر الطريقة العادية
  `agent` في gateway:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة لوكيل gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن thread
    الخاص بـ app-server يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط اختبار smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا ينجح
  عطل حزمة Codex بسبب الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية
  من `~/.codex/auth.json` و`~/.codex/config.toml`

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
  مصادقة Codex CLI عند وجودها، ويثبّت `@openai/codex` في بادئة npm
  قابلة للكتابة ومركّبة، ويجهز شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker فحوصات الصورة وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق
  إعداد الاختبار الحي، حتى لا يتمكن الرجوع إلى `openai-codex/*` أو PI من إخفاء
  تراجع في حزمة Codex.

### وصفات live الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل تعطلًا:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار smoke لـ gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة profile)؛ وهذا هو المقصود عادةً عند معظم المستخدمين بكلمة “Gemini”.
  - CLI: يقوم OpenClaw بتنفيذ binary محلي باسم `gemini`؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (البث، ودعم الأدوات، واختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد «قائمة نماذج CI» ثابتة (لأن live يعمل بالاشتراك الاختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل «النماذج الشائعة» الذي نتوقع أن يستمر في العمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار smoke لـ gateway مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّدين:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو الأحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا ممكّنًا وقادرًا على `tools`)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

أدرج نموذجًا واحدًا على الأقل قادرًا على معالجة الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لاختبار فحص الصورة.

### المجمعات / البوابات البديلة

إذا كانت المفاتيح مفعلة لديك، فإننا ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على tools+image)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزوّدين الذين يمكنك تضمينهم في مصفوفة live (إذا كانت لديك بيانات الاعتماد/الإعداد):

- المضمنة: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic (مثل LM Studio وvLLM وLiteLLM وغيرها)

نصيحة: لا تحاول تثبيت «كل النماذج» بشكل صلب داخل المستندات. القائمة الموثوقة هي أي شيء تعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُودَع أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي تستخدمها CLI. والنتائج العملية لذلك:

- إذا كانت CLI تعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي «لا توجد بيانات اعتماد»، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة الخاصة بكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا هو المقصود بـ «مفاتيح profile» في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى home الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تقوم التشغيلات الحية المحلية افتراضيًا بنسخ الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت؛ وتتجاوز البيوت الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسارات `agents.*.workspace` و`agentDir` حتى تبقى الفحوصات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا أردت الاعتماد على مفاتيح env (مثل تلك المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (تفريغ الصوت)

- الاختبار: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `src/agents/byteplus.live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- تجاوز نموذج اختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المضمنة في comfy
  - يتخطى كل قدرة ما لم يتم إعداد `models.providers.comfy.<capability>`
  - مفيد بعد تغيير إرسال سير عمل comfy، أو polling، أو التنزيلات، أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد لتوليد الصور تم تسجيله
  - يحمّل متغيرات env المفقودة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف profile/نموذجًا صالحًا
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمنون المغطون حاليًا:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف profile/نموذجًا صالحًا
  - يشغّل وضعي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate` و`edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمن المشترك
  - يضبط افتراضيًا مسار smoke آمنًا للإصدار: مزوّدون غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر مدته ثانية واحدة، وحدّ عمليات لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف profile/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع transform المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محليًا معتمدًا على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محليًا معتمدًا على buffer في المسح المشترك
  - المزوّدون المعلن عنهم لكن المتخطَّون حاليًا في `imageToVideo` ضمن المسح المشترك:
    - `vydra` لأن `veo3` المضمن نصي فقط و`kling` المضمن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` للنص إلى فيديو بالإضافة إلى مسار `kling` يستخدم fixture افتراضيًا لصورة عبر URL بعيد
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون المعلن عنهم لكن المتخطَّون حاليًا في `videoToVideo` ضمن المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا URLات مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لعمليات inpaint/remix الخاصة بالفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لعملية كل مزوّد من أجل تشغيل smoke أكثر شدة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## الحزمة الاختبارية media live

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول واحدة أصلية للمستودع
  - يحمّل تلقائيًا متغيرات env المفقودة الخاصة بالمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، حتى يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغلات Docker (اختبارات اختيارية من نوع «يعمل في Linux»)

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق الخاص بمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حدًا أصغر لاختبار smoke حتى يبقى المسح الكامل داخل Docker عمليًا:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويضبط
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً المسح الأكبر والأشمل.
- يقوم `test:docker:all` ببناء صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغلات smoke الخاصة بالحاويات: تقوم `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` بتشغيل حاوية حقيقية واحدة أو أكثر والتحقق من مسارات تكامل أعلى مستوى.

تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب homes المصادقة الخاصة بـ CLI المطلوبة فقط ربطيًا (أو جميع المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى تتمكن مصادقة OAuth الخاصة بـ CLI الخارجي من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار smoke لربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار smoke للواجهة الخلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار smoke لحزمة Codex app-server: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار smoke حي لـ Open WebUI: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding (TTY، إعداد كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway (حاويتان، مصادقة WS + health): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار smoke خام لإطار إشعارات Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (اختبار smoke للتثبيت + الاسم المستعار `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
ثم تجهيزها داخل دليل عمل مؤقت داخل الحاوية. يُبقي هذا صورة وقت التشغيل
خفيفة، مع الاستمرار في تشغيل Vitest على المصدر/الإعداد المحليين المطابقين لديك.
تتجاوز خطوة التجهيز caches المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية أو
مخرجات Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما تضبط هذه المشغلات `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات gateway الحية
عمال قنوات Telegram/Discord/إلخ الحقيقية داخل الحاوية.
ما يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من مسار Docker هذا.
يمثل `test:docker:openwebui` اختبار smoke توافقًا أعلى مستوى: فهو يبدأ
حاوية Gateway لـ OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI نفسه إلى إكمال إعداد البدء البارد.
يتوقع هذا المسار مفتاح نموذج حي صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في التشغيلات ضمن Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
تم تصميم `test:docker:mcp-channels` ليكون حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مزروعة، ثم يبدأ حاوية ثانية تُشغّل `openclaw mcp serve`، وبعد ذلك
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات transcript، وبيانات المرفقات الوصفية،
وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات على نمط Claude عبر جسر MCP الحقيقي القائم على stdio. ويقوم فحص الإشعارات
بفحص إطارات stdio MCP الخام مباشرة حتى يتحقق smoke مما يصدره
الجسر فعلًا، وليس فقط مما قد تُظهره SDK محددة للعميل.

اختبار smoke يدوي لخيط ACP بلغة طبيعية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالاختبارات التراجعية/تصحيح الأخطاء. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات env المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة config/workspace مؤقتة ومن دون أي تركيبات لمصادقة CLI الخارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركّب إلى `/home/node/.npm-global` لتخزين تثبيتات CLI مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تُركّب تشغيلات المزوّد المضيقة فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوزها يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` الحالية في إعادة التشغيلات التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` للتأكد من أن بيانات الاعتماد تأتي من مخزن profile (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه gateway لاختبار smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt التحقق من nonce المستخدم بواسطة اختبار smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل من anchors في Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال (آمن لـ CI)

هذه اختبارات تراجعية لخط أنابيب «حقيقي» من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway + حلقة agent حقيقية): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، يكتب config + auth مفروضَين): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف كأنها «تقييمات موثوقية للوكيل»:

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من طرف إلى طرف تتحقق من ربط الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما يزال ما ينقص Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل الـ Skill الصحيح (أو يتجنب غير المرتبط)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءة ملفات Skill، وربط الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، والبوابات، وحقن prompt).
- تقييمات حية اختيارية (مقيّدة عبر env) فقط بعد اكتمال المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاصة بهما. فهي تتكرر عبر جميع Plugins المكتشفة وتشغّل
مجموعة من تأكيدات الشكل والسلوك. يتجاوز مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالواجهات واختبارات smoke؛ شغّل أوامر العقود صراحةً
عندما تعدّل أسطح القنوات أو المزوّدات المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدات فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف الخيط
- **directory** - واجهة directory/roster
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات أو مسارات `plugin-sdk` الفرعية
- بعد إضافة Plugin قناة أو مزوّد أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة في مزوّد/نموذج تم اكتشافها في live:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقط التحويل الدقيق لشكل الطلب)
- إذا كانت المشكلة بطبيعتها live-only (حدود المعدل، وسياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا ومفعّلًا اختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في خط جلسة/سجل/أدوات gateway → اختبار smoke حي لـ gateway أو اختبار Gateway وهمي وآمن لـ CI
- حاجز اجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف معيّن واحد لكل فئة SecretRef من بيانات registry metadata (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

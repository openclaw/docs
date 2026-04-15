---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، مشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-15T07:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf647a5cf13b5861a3ba0cb367dc816c57f0e9c60d3cd6320da193bfadf5609
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration وe2e وlive) ومجموعة صغيرة من مشغّلات Docker.

هذا المستند هو دليل «كيف نختبر»:

- ما الذي تغطيه كل مجموعة (وما الذي لا تغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح)
- كيف تكتشف اختبارات live بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات انحدار لمشكلات النموذج/المزوّد في العالم الحقيقي

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع محليًا للمجموعة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات مباشرة يوجّه الآن أيضًا مسارات الامتداد/القناة: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل عمليات التشغيل المستهدفة أولًا عندما تكون تعمل على تكرار معالجة فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- مجموعة Live (استقصاءات النماذج + أدوات Gateway/الصور): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فاشلة واحدة، ففضّل تضييق اختبارات live عبر متغيرات البيئة الخاصة بقائمة السماح الموصوفة أدناه.

## مشغّلات خاصة بـ QA

تأتي هذه الأوامر إلى جانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين، حتى 64 عاملًا أو عدد السيناريوهات المحدد. استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة افتراضية Linux مؤقتة عبر Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الموجود في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها الخاصة بـ `qa suite`.
  - تمرّر عمليات التشغيل live مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار إعداد مزوّد QA live، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر مساحة العمل المركبة.
  - يكتب تقرير QA والملخّص المعتادين بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix live QA مقابل خادوم منزلي Tuwunel مؤقت ومدعوم بـ Docker.
  - مضيف QA هذا مخصّص للمستودع/التطوير فقط حاليًا. تثبيتات OpenClaw المعبأة لا تشحن `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تقوم نسخ المستودع بتحميل المشغّل المضمّن مباشرة؛ ولا حاجة إلى خطوة تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمي Matrix مؤقتين (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ ابن QA Gateway مع Plugin Matrix الحقيقي بوصفه نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها عبر `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يوفّر Matrix علامات مصدر بيانات اعتماد مشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA وملخّصًا وأثرًا للأحداث المرصودة ضمن `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram live QA مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram رقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود التأجير المجمّعة.
  - يتطلب botين مختلفين داخل المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT لاسم مستخدم Telegram.
  - للحصول على رصد مستقر بين bot وbot، فعّل وضع التواصل بين Bot-to-Bot في `@BotFather` لكلا botين وتأكد من أن bot الخاص بـ driver يستطيع رصد حركة bot ضمن المجموعة.
  - يكتب تقرير Telegram QA وملخّصًا وأثر الرسائل المرصودة ضمن `.artifacts/qa-e2e/...`.

تشترك مسارات النقل live في عقد قياسي واحد حتى لا تنحرف عمليات النقل الجديدة:

يبقى `qa-channel` مجموعة QA الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية النقل live.

| المسار | Canary | تقييد الإشارة | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | رصد التفاعلات | أمر المساعدة |
| ------ | ------ | -------------- | ---------------- | ---------------------- | ------------------------- | -------------- | ------------ | -------------- | ------------ |
| Matrix   | x      | x              | x                | x                      | x                         | x              | x            | x              |              |
| Telegram | x      |                |                  |                        |                           |                |              |                | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار v1)

عندما يكون `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) مفعّلًا من أجل
`openclaw qa telegram`، يحصل QA lab على عقد تأجير حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لهذا العقد أثناء تشغيل المسار، ثم يحرّر العقد عند الإيقاف.

مرجع هيكل مشروع Convex:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الافتراضي عبر env: `OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي `maintainer`)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبّع اختياري)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` يسمح بعناوين Convex من نوع `http://` على local loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` الصيغة `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد المجموعة) تحديدًا
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` لإخراج قابل للقراءة الآلية في السكربتات وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - نفاد المجموعة/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- تتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` وترفض الحمولة غير الصحيحة.

### إضافة قناة إلى QA

إضافة قناة إلى نظام QA المبني على Markdown تتطلب أمرين فقط بالضبط:

1. مُهايئ نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أوامر QA جديدًا على المستوى الأعلى عندما يمكن لمضيف `qa-lab` المشترك
امتلاك هذا التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر أوامر `openclaw qa`
- بدء المجموعة وإنهاؤها
- توازي العمال
- كتابة الآثار
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّلات عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية إعداد Gateway لهذا النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية رصد الرسائل الصادرة
- كيفية كشف النصوص المنسوخة وحالة النقل المطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ مشغّل النقل على واجهة مضيف `qa-lab` المشتركة.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو أداة القناة.
4. تركيب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب أن تعلن Plugins المشغّلات `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ يجب أن يبقى CLI الكسول وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت `qa/scenarios/`.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin ذلك المشغّل أو أداة Plugin.
- إذا احتاج السيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى فقط لنقل واحد، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

أسماء المساعدات العامة المفضلة للسيناريوهات الجديدة هي:

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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
توجد أسماء التوافق البديلة لتجنّب ترحيل شامل في يوم واحد، وليس لتكون النموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات باعتبارها «واقعية متزايدة» (ومعها زيادة في عدم الاستقرار/الكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر عمليات shard متسلسلة (`vitest.full-*.config.ts`) فوق مشاريع Vitest المقيّدة الحالية
- الملفات: جرد core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` الخاصة بـ node والمسموح بها والمشمولة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - أصبح `pnpm test` غير المستهدف يشغّل الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية جذر مشروع أصلية واحدة ضخمة. هذا يقلّل ذروة RSS على الأجهزة المزدحمة ويمنع أعمال `auto-reply`/الامتدادات من تجويع المجموعات غير المرتبطة.
  - ما يزال `pnpm test --watch` يستخدم رسم المشاريع في `vitest.config.ts` الخاص بالجذر الأصلي، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
  - أصبح `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` يوجّهون أهداف الملفات/الأدلة الصريحة عبر المسارات المقيّدة أولًا، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب كلفة بدء تشغيل مشروع الجذر الكامل.
  - يقوم `pnpm test:changed` بتوسيع مسارات git المتغيرة إلى المسارات المقيّدة نفسها عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه؛ أما تعديلات الإعداد/التهيئة فما تزال تعود إلى إعادة تشغيل واسعة لمشروع الجذر.
  - يتم توجيه اختبارات unit خفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات `auto-reply`، و`plugin-sdk`، والمناطق النفعية الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة من حيث الحالة/وقت التشغيل على المسارات الحالية.
  - كما يتم تعيين بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` في تشغيل وضع التغييرات إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاث حاويات مخصصة: مساعدات core من المستوى الأعلى، واختبارات التكامل `reply.*` من المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. وهذا يبقي أثقل أعمال أدوات `reply` بعيدًا عن اختبارات الحالة/الأجزاء/الرموز الأرخص.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction،
    فحافظ على مستويي التغطية كليهما.
  - أضف اختبارات انحدار مركّزة للمساعدات الخاصة بحدود التوجيه/التطبيع الخالصة.
  - وحافظ أيضًا على سلامة مجموعات تكامل المشغّل المضمّن:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المقيّدة وسلوك Compaction ما يزالان يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات المساعدات وحدها
    بديلًا كافيًا عن مسارات التكامل تلك.
- ملاحظة التجميع:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - كما يثبّت إعداد Vitest المشترك أيضًا `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وتهيئات e2e وlive.
  - يحتفظ مسار UI الخاص بالجذر بإعداد `jsdom` والمُحسّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - ترث كل shard في `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` افتراضيًا لعمليات Node الابنة الخاصة بـ Vitest لتقليل تقلبات ترجمة V8 أثناء عمليات التشغيل المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت بحاجة إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يوجّه `pnpm test:changed` عبر المسارات المقيّدة عندما تطابق المسارات المتغيرة مجموعة أصغر بشكل نظيف.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى أكبر للعمال.
  - أصبح التوسّع التلقائي المحلي للعمال محافظًا عمدًا الآن، كما يتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا أصلًا، بحيث تسبب عمليات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
  - يضع إعداد Vitest الأساسي ملفات المشاريع/الإعداد كـ `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغييرات صحيحة عندما تتغير توصيلات الاختبار.
  - يحتفظ الإعداد بتمكين `OPENCLAW_VITEST_FS_MODULE_CACHE` على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع ذاكرة مؤقتة صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّهة ومسار مشروع الجذر الأصلي لذلك الفرق الملتزم ويطبع زمن التنفيذ بالإضافة إلى أقصى RSS على macOS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية المتسخة عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعداد Vitest الخاص بجذر المشروع.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لأعباء بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### E2E (اختبار Gateway دخاني)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts`
- القيم الافتراضية لوقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (في CI: حتى 2، ومحليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج الطرفية.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات الطرفية التفصيلية.
- النطاق:
  - سلوك Gateway الشامل من النهاية إلى النهاية متعدد النسخ
  - أسطح WebSocket/HTTP، واقتران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار OpenShell الخلفي الدخاني

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell Gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس الواجهة الخلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` وSSH exec حقيقيين
  - يتحقق من سلوك نظام الملفات القانوني عن بُعد عبر جسر نظام ملفات sandbox
- التوقعات:
  - اشتراك اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway وsandbox الخاصين بالاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي أو سكربت تغليف غير افتراضي

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟»
  - التقاط تغيّرات تنسيق المزوّد، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليست مستقرة على CI بطبيعتها (شبكات حقيقية، سياسات مزوّدين حقيقية، حصص، انقطاعات)
  - تكلّف مالًا / تستهلك حدود المعدل
  - يفضَّل تشغيل مجموعات فرعية مقيّدة بدلًا من «كل شيء»
- تستورد عمليات live الملف `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما تزال عمليات live تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى home اختباري مؤقت حتى لا تتمكن تجهيزات unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات live دليل home الحقيقي لديك.
- أصبح `pnpm test:live` الآن يستخدم وضعًا أكثر هدوءًا افتراضيًا: فهو يحتفظ بإخراج التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع Gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بصيغة فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثلًا `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا خاصًا بـ live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حد المعدل.
- مخرجات التقدم/Heartbeat:
  - أصبحت مجموعات live الآن تصدر أسطر التقدم إلى stderr بحيث يظهر نشاط استدعاءات المزوّد الطويلة بوضوح حتى عندما يكون التقاط طرفية Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض طرفية Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway مباشرة أثناء عمليات live.
  - اضبط Heartbeat الخاص بالنموذج المباشر عبر `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ Gateway/الاستقصاء عبر `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا كنت قد غيّرت الكثير)
- عند لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح «البوت الخاص بي متوقف» / حالات الفشل الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` بشكل مقيّد

## Live: مسح قدرات Android Node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلَن عنه حاليًا** بواسطة Android Node متصل والتحقق من سلوك عقد الأوامر.
- النطاق:
  - إعداد مسبق/يدوي (المجموعة لا تثبّت التطبيق أو تشغّله أو تقترنه).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل بالفعل + مقترن مع Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار النموذج الدخاني (مفاتيح الملف الشخصي)

تنقسم اختبارات live إلى طبقتين حتى يمكننا عزل حالات الفشل:

- يبيّن «النموذج المباشر» ما إذا كان المزوّد/النموذج قادرًا على الإجابة أصلًا باستخدام المفتاح المحدد.
- يبيّن «اختبار Gateway الدخاني» ما إذا كان خط Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات الانحدار المستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعلًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على اختبار Gateway الدخاني
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (`Opus/Sonnet 4.6+`، و`GPT-5.x + Codex`، و`Gemini 3`، و`GLM 4.7`، و`MiniMax M2.7`، و`Grok 4`)
  - `OPENCLAW_LIVE_MODELS=all` اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح modern شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل بين «واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح» و«خط Gateway للوكيل معطّل»
  - يحتوي على اختبارات انحدار صغيرة ومعزولة (مثال: تدفق إعادة تشغيل الاستدلال + تدفقات استدعاء الأدوات في OpenAI Responses/Codex Responses)

### الطبقة 2: اختبار Gateway + وكيل التطوير الدخاني (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تعديل جلسة `agent:dev:*` (مع تجاوز النموذج في كل تشغيل)
  - التكرار عبر النماذج التي تملك مفاتيح والتحقق من:
    - استجابة «ذات معنى» (من دون أدوات)
    - أن استدعاء أداة حقيقي يعمل (`read` probe)
    - استقصاءات أدوات إضافية اختيارية (`exec+read` probe)
    - أن مسارات الانحدار الخاصة بـ OpenAI (من استدعاء أدوات فقط → متابعة) تستمر في العمل
- تفاصيل الاستقصاءات (حتى تتمكن من شرح حالات الفشل بسرعة):
  - استقصاء `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` قراءته ثم إعادة nonce.
  - استقصاء `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة nonce في ملف مؤقت، ثم `read` قراءته مرة أخرى.
  - استقصاء الصور: يرفق الاختبار ملف PNG مُولّدًا (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (`Opus/Sonnet 4.6+`، و`GPT-5.x + Codex`، و`Gemini 3`، و`GLM 4.7`، و`MiniMax M2.7`، و`Grok 4`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح Gateway الحديثة/`all` حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب «كل شيء من OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون استقصاءات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار live:
  - استقصاء `read` + استقصاء `exec+read` (ضغط على الأدوات)
  - يعمل استقصاء الصور عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا يحوي “CAT” + رمزًا عشوائيًا (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` مع `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (مع سماحية OCR: الأخطاء الطفيفة مقبولة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار CLI الخلفي الدخاني (Claude أو Codex أو Gemini أو CLIات محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط Gateway + الوكيل باستخدام واجهة خلفية CLI محلية، من دون لمس إعدادك الافتراضي.
- القيم الافتراضية الخاصة بكل واجهة خلفية لاختبار smoke موجودة مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات تعريف Plugin مالك الواجهة الخلفية CLI.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل استقصاء الاستمرارية الافتراضي للجلسة نفسها من Claude Sonnet إلى Opus (اضبطه إلى `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

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
- يشغّل اختبار smoke للواجهة الخلفية CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحلّل بيانات تعريف اختبار smoke لـ CLI من الامتداد المالك، ثم يثبت حزمة CLI المطابقة لـ Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورتين للواجهة الخلفية CLI في Gateway من دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. يعطّل هذا المسار الخاص بالاشتراك استقصاءات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- أصبح اختبار smoke للواجهة الخلفية CLI الآن يمارس التدفق نفسه من النهاية إلى النهاية لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صور، ثم استدعاء أداة MCP `cron` يجري التحقق منه عبر CLI الخاص بـ Gateway.
- كما أن اختبار smoke الافتراضي لـ Claude يعدّل الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: اختبار ACP bind الدخاني (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى نص جلسة ACP المنسوخ المرتبط
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر عبر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة على نمط الرسائل الخاصة في Slack
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول synthetic originating-route مخصّصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` المضمّن لوكيل حزمة ACP المحدد.

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
- افتراضيًا، يشغّل اختبار ACP bind الدخاني مقابل جميع وكلاء CLI الحيين المدعومين بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يبقي acpx متغيرات env الخاصة بالمزوّد من profile المستورَد متاحةً لـ CLI الابن الخاص بالحزمة.

## Live: اختبار Codex app-server harness الدخاني

- الهدف: التحقق من أداة Codex المملوكة لـ Plugin عبر
  طريقة `agent` العادية في Gateway:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل في Gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة
    app-server يمكنها الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- استقصاء صور اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- استقصاء MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط اختبار smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا ينجح
  عطب أداة Codex عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من الصدفة/الملف الشخصي، بالإضافة إلى نسخ
  اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`

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
- يستورد `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات
  مصادقة Codex CLI عند وجودها، ويثبت `@openai/codex` في بادئة npm
  مركبة قابلة للكتابة، ويجهّز شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker استقصاءات الصور وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي حتى لا يتمكن الرجوع إلى `openai-codex/*` أو PI من إخفاء
  انحدار في أداة Codex.

### وصفات live الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتعطل:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار Gateway دخاني:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / الملف الشخصي)؛ وهذا ما يقصده معظم المستخدمين عندما يقولون «Gemini».
  - CLI: ينفّذ OpenClaw أمرًا خارجيًا إلى ملف `gemini` الثنائي المحلي؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (الدفق/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد «قائمة نماذج CI» ثابتة (لأن live اشتراك اختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل «النماذج الشائعة» الذي نتوقع أن يستمر في العمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار Gateway الدخاني مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الخط الأساسي: استدعاء الأدوات (`Read` + `Exec` اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد وجودها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على «الأدوات» ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال الصور (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على التعامل مع الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/إصدارات OpenAI القادرة على الرؤية، إلخ) لتمرين استقصاء الصور.

### المجمّعات / Gateways البديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك تضمينهم في مصفوفة live (إذا كانت لديك بيانات الاعتماد/الإعداد):

- مضمّنون: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصّصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (مثل LM Studio أو vLLM أو LiteLLM، إلخ)

نصيحة: لا تحاول تثبيت «كل النماذج» بشكل صارم داخل المستندات. القائمة المرجعية الموثوقة هي ما تعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُلتزم أبدًا)

تكتشف اختبارات live بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. والنتائج العملية لذلك:

- إذا كان CLI يعمل، فيجب أن تجد اختبارات live المفاتيح نفسها.
- إذا قالت اختبارات live «لا توجد بيانات اعتماد»، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات مصادقة كل وكيل على حدة: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا هو المقصود بعبارة «مفاتيح الملف الشخصي» في اختبارات live)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى home live المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تقوم عمليات live المحلية افتراضيًا بنسخ الإعداد النشط، وملفات `auth-profiles.json` الخاصة بكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت؛ وتتخطى homes live المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` / `agentDir` حتى تبقى الاستقصاءات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا أردت الاعتماد على مفاتيح env (مثل المفاتيح المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (فيمكنها تحميل `~/.profile` داخل الحاوية).

## Deepgram live (نسخ الصوت)

- الاختبار: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- التمكين: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `src/agents/byteplus.live.test.ts`
- التمكين: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- تجاوز النموذج اختياريًا: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم يكن `models.providers.comfy.<capability>` مضبوطًا
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستطلاع أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- أداة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد إنشاء صور مسجّل
  - يحمّل متغيرات env المفقودة الخاصة بالمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الاستقصاء
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل متغيرات إنشاء الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون الحاليون المشمولون:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّد إنشاء الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الاستقصاء
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل وضعي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy live منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يمارس مسار مزوّد إنشاء الفيديو المضمّن المشترك
  - يستخدم افتراضيًا مسار smoke الآمن للإصدار: مزوّدون غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt lobster لمدة ثانية واحدة، وسقف عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الصف لدى المزوّد يمكن أن يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الاستقصاء
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صور محلي مدعومًا بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعومًا بالمخزن المؤقت في المسح المشترك
  - المزوّدون الحاليون المعلن عنهم لكن المتخطَّون في `imageToVideo` ضمن المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصّي فقط و`kling` المضمّن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تجهيز URL صورة بعيد افتراضيًا
  - التغطية الحالية لـ `videoToVideo` في live:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون الحاليون المعلن عنهم لكن المتخطَّون في `videoToVideo` ضمن المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لعمليات inpaint/remix للفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل سقف العملية لكل مزوّد من أجل تشغيل smoke شديد
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات env فقط

## أداة media live

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات live المشتركة الخاصة بالصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات env المفقودة الخاصة بالمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (اختيارات «يعمل على Linux»)

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق المعتمد على مفاتيح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا جرى تركيبه). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حدًا أصغر لاختبارات smoke حتى يبقى المسح الكامل داخل Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً إجراء المسح الشامل الأكبر.
- يقوم `test:docker:all` ببناء صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغّلات smoke الخاصة بالحاويات: تقوم `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` بتشغيل حاوية واحدة أو أكثر فعلية والتحقق من مسارات تكامل أعلى مستوى.

كما تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب أدلة مصادقة CLI المطلوبة فقط (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مقيّدًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بالـ CLI الخارجية من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار ACP bind الدخاني: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار CLI backend الدخاني: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار Codex app-server harness الدخاني: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار Open WebUI live الدخاني: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، هيكلة كاملة): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway (حاويتان، مصادقة WS + السلامة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (Gateway مُهيّأ مسبقًا + جسر stdio + اختبار smoke خام لإطار إشعارات Claude): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (اختبار smoke للتثبيت + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)

كما تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
وتجهيزها في دليل عمل مؤقت داخل الحاوية. يحافظ هذا على نحافة صورة وقت التشغيل
مع الاستمرار في تشغيل Vitest مقابل المصدر/الإعداد المحليين لديك بدقة.
تتجاوز خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة فقط وملفات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
أدلة مخرجات Gradle حتى لا تقضي عمليات Docker live دقائق في نسخ
الآثار الخاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ استقصاءات Gateway live
عمّال قنوات حقيقيين مثل Telegram/Discord وغيرها داخل الحاوية.
ما يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
live من ذلك المسار داخل Docker.
يُعد `test:docker:openwebui` اختبار توافق دخانيًا أعلى مستوى: فهو يبدأ
حاوية OpenClaw Gateway مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبّتة الإصدار مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الوسيلة الأساسية لتوفيره في عمليات Dockerized.
تطبع العمليات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
يُصمَّم `test:docker:mcp-channels` عمدًا ليكون حتميًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مُهيّأة مسبقًا، ثم يبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص المنسوخة، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الصلاحيات على نمط Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرةً حتى يثبت اختبار smoke ما يصدره الجسر فعليًا،
وليس فقط ما قد تعرضه حزمة SDK عميل معيّنة.

اختبار ACP اليدوي لسلسلة اللغة الطبيعية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكريبت لسير عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات env المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) ويُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) ويُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) ويُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم عمليات التشغيل المقيّدة بحسب المزوّد بتركيب الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - يمكن التجاوز يدويًا عبر `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` الموجودة مسبقًا في عمليات الإعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن الملفات الشخصية (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرِضه Gateway لاختبار Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt التحقق من nonce المستخدم في اختبار Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّت

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل من Anchors في Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار الانحدار دون اتصال (آمن لـ CI)

هذه اختبارات انحدار «لخط حقيقي» من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (محاكاة OpenAI، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، مع فرض كتابة الإعداد + المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل «تقييمات موثوقية الوكيل»:

- استدعاء أدوات وهمي عبر حلقة Gateway + الوكيل الحقيقية (`src/gateway/gateway.test.ts`).
- تدفقات معالج شاملة تتحقق من توصيل الجلسات وآثار الإعداد (`src/gateway/gateway.test.ts`).

ما الذي ما يزال مفقودًا بالنسبة إلى Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، وترحيل سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، البوابات، حقن prompt).
- تقييمات live اختيارية (اشتراك اختياري ومحكومة بـ env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. فهي تمر على كل Plugins المكتشفة وتشغّل مجموعة من
التحققات الخاصة بالشكل والسلوك. يتخطى مسار unit الافتراضي في `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالواجهات واختبارات smoke؛ شغّل أوامر العقود صراحةً
عندما تلمس أسطح القنوات أو المزوّدات المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدات فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف السلسلة
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - استقصاءات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات `plugin-sdk` أو مساراتها الفرعية
- بعد إضافة Plugin قناة أو مزوّد أو تعديلها
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات الانحدار (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبار انحدار آمنًا لـ CI إذا أمكن (محاكاة/Stub للمزوّد، أو التقاط تحويل شكل الطلب بدقة)
- إذا كانت المشكلة بطبيعتها live فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا ومشروطًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في خط جلسة/سجل/أدوات Gateway → اختبار Gateway live الدخاني أو اختبار محاكاة Gateway آمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف معيّن واحد لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنّفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

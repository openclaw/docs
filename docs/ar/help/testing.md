---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات منع التراجع لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway + الوكيل
summary: 'مجموعة الاختبار: أجنحة unit/e2e/live، ومشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-20T07:30:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاثة أجنحة Vitest (unit/integration وe2e وlive) ومجموعة صغيرة من مشغّلات Docker.

هذا المستند هو دليل "كيف نختبر":

- ما الذي يغطيه كل جناح (وما الذي لا يغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسيناريوهات العمل الشائعة (محليًا، قبل الدفع، التصحيح)
- كيف تكتشف اختبارات live بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات منع التراجع للمشكلات الواقعية الخاصة بالنماذج/المزوّدين

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع للجناح الكامل محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف ملف مباشر يوجّه الآن أيضًا مسارات الامتدادات/القنوات: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات الموجّهة أولًا عندما تعمل على تكرار حل إخفاق واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- جناح E2E: `pnpm test:e2e`

عند تصحيح المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- جناح Live (مجسّات النماذج + أدوات Gateway/الصور): `pnpm test:live`
- استهداف ملف live واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، فالأفضل تضييق اختبارات live باستخدام متغيرات بيئة قائمة السماح الموضّحة أدناه.

## المشغّلات الخاصة بـ QA

توجد هذه الأوامر بجانب أجنحة الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين. تستخدم `qa-channel` مستوى تزامن افتراضيًا قدره 4 (ضمن حدود عدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على المخرجات دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية للتركيبات والـ protocol mock دون استبدال مسار `mock-openai` المعتمد على السيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل جناح QA نفسه داخل آلة Linux افتراضية مؤقتة عبر Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - في التشغيلات الحية، يمرّر مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على البيئة، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME` عند توفره.
  - يجب أن تبقى أدلة المخرجات تحت جذر المستودع حتى يتمكن الضيف من الكتابة إليها عبر مساحة العمل المركّبة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA على نمط المشغّل.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - مضيف QA هذا خاص بالمستودع/التطوير فقط حاليًا. لا تتضمن تثبيتات OpenClaw المعبأة `qa-lab`، ولذلك لا توفّر `openclaw qa`.
  - تقوم نسخ المستودع بتحميل المشغّل المضمّن مباشرة؛ لا حاجة إلى خطوة منفصلة لتثبيت Plugin.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA Gateway مع Plugin Matrix الحقيقي باعتباره نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix عن علامات مشتركة لمصادر بيانات الاعتماد لأن هذا المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA وملخصًا وملف observed-events وسجل خرج موحّد stdout/stderr تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بالسائق وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram رقميًا.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاستخدام الحجوزات المجمّعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على المخرجات دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، على أن يكشف bot الخاص بـ SUT عن اسم مستخدم Telegram.
  - لضمان مراقبة ثابتة بين bot وآخر، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا botين، وتأكد من أن bot السائق يمكنه مراقبة حركة bot داخل المجموعة.
  - يكتب تقرير Telegram QA وملخصًا وملف observed-messages تحت `.artifacts/qa-e2e/...`.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

تظل `qa-channel` جناح QA الاصطناعي الواسع، وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار | Canary | تقييد الإشارة | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة |
| ------ | ------ | -------------- | ---------------- | -------------------- | -------------------------- | -------------- | ------------ | ---------------- | ------------ |
| Matrix   | x      | x              | x                | x                    | x                          | x              | x            | x                |              |
| Telegram | x      |                |                  |                      |                            |                |              |                  | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار 1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على حجز حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat لهذا الحجز أثناء تشغيل المسار، ويحرّر الحجز عند الإغلاق.

الهيكل المرجعي لمشروع Convex:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الافتراضي من البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (القيمة الافتراضية `ci` في CI، و`maintainer` بخلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يتيح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` عناوين Convex من نوع loopback `http://` لأغراض التطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرف (إضافة/إزالة/سرد المجموعة)
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
  - حالات النفاد/القابلة لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /admin/add` (سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حماية الحجز النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة تمثل معرّف دردشة Telegram رقميًا.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين فقط بالضبط:

1. محوّل نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أمر QA جديدًا من المستوى الأعلى عندما يكون بإمكان مضيف `qa-lab` المشترك امتلاك هذا التدفق.

يمتلك `qa-lab` آليات الاستضافة المشتركة:

- جذر الأمر `openclaw qa`
- بدء الجناح وإنهاؤه
- تزامن العمّال
- كتابة المخرجات
- توليد التقارير
- تنفيذ السيناريوهات
- الأسماء البديلة التوافقية لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّلات عقد النقل:

- كيف يتم تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيف تتم تهيئة Gateway لهذا النقل
- كيف يتم التحقق من الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُرصد الرسائل الصادرة
- كيف تُكشف النصوص وسجل حالة النقل المطبع
- كيف تُنفذ الإجراءات المدعومة بالنقل
- كيف تتم إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. الإبقاء على `qa-lab` مالكًا للجذر المشترك `qa`.
2. تنفيذ مشغّل النقل على واجهة الاستضافة المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة القناة.
4. تركيب المشغّل بوصفه `openclaw qa <runner>` بدلًا من تسجيل جذر أمر منافس.
   يجب أن تعلن Plugins المشغّلات `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفًا؛ يجب أن تبقى عمليات CLI والمشغّل الكسولة خلف نقاط دخول منفصلة.
5. كتابة أو تكييف سيناريوهات Markdown ضمن أدلة `qa/scenarios/` ذات الطابع المناسب.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. الإبقاء على الأسماء البديلة التوافقية الحالية ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه داخل Plugin ذلك المشغّل أو حزمة Plugin.
- إذا احتاج سيناريو ما إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
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

تظل الأسماء البديلة التوافقية متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة الخاصة بالقنوات أسماء المساعدات العامة.
توجد الأسماء البديلة التوافقية لتجنّب ترحيل شامل دفعة واحدة، وليس بوصفها
النموذج الذي ينبغي اتباعه عند تأليف السيناريوهات الجديدة.

## أجنحة الاختبار (ما الذي يعمل وأين)

فكّر في الأجنحة على أنها "زيادة في الواقعية" (وزيادة في القابلية للتذبذب/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات شظايا متسلسلة (`vitest.full-*.config.ts`) فوق مشاريع Vitest المحددة الحالية
- الملفات: قوائم unit الأساسية تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`، واختبارات `ui` الخاصة بـ node المسموح بها والمشمولة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعدادات)
  - اختبارات منع تراجع حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - أصبح `pnpm test` غير الموجّه يشغّل الآن أحد عشر إعداد شظايا أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية جذر أصلية ضخمة واحدة. هذا يقلّل ذروة RSS على الأجهزة المزدحمة ويتجنب أن تتسبب أعمال auto-reply/extension في تجويع الأجنحة غير المرتبطة.
  - يظل `pnpm test --watch` يستخدم مخطط المشاريع الأصلي للجذر في `vitest.config.ts`، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
  - تمرّر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات المحددة أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` تكلفة بدء تشغيل مشروع الجذر الكامل.
  - يقوم `pnpm test:changed` بتوسيع مسارات git المتغيرة إلى المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ أما تعديلات الإعداد/التهيئة فتعيد اللجوء إلى إعادة تشغيل مشروع الجذر الواسعة.
  - يتم توجيه اختبارات unit الخفيفة من ناحية الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، والمناطق النفعية الخالصة المشابهة عبر المسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ أما الملفات الثقيلة من ناحية الحالة/وقت التشغيل فتبقى على المسارات الحالية.
  - تقوم بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` أيضًا بربط التشغيلات في وضع التغييرات باختبارات شقيقة صريحة ضمن تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل الجناح الثقيل الكامل لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاث حزم مخصصة: مساعدات core من المستوى الأعلى، واختبارات التكامل `reply.*` من المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يبقي أصعب أعمال reply harness بعيدًا عن اختبارات الحالة/التجزئة/الرمز الأرخص.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction،
    حافظ على مستويي التغطية معًا.
  - أضف اختبارات منع تراجع مركّزة للمساعدات عند حدود التوجيه/التطبيع الخالصة.
  - وحافظ أيضًا على سلامة أجنحة تكامل المشغّل المضمّن:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه الأجنحة من أن المعرّفات المحددة وسلوك Compaction لا يزالان يمران
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ اختبارات المساعدات وحدها ليست
    بديلًا كافيًا لهذه مسارات التكامل.
- ملاحظة التجميعة:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - كما يثبّت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وتهيئات e2e وlive.
  - يحتفظ مسار UI في الجذر بإعداد `jsdom` والمُحسّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - ترث كل شظية من `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` افتراضيًا لعمليات Node الفرعية الخاصة بـ Vitest لتقليل تذبذب تجميع V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يوجّه `pnpm test:changed` عبر المسارات المحددة عندما ترتبط المسارات المتغيرة بجناح أصغر بشكل واضح.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، لكن مع حد أعلى أكبر للعمّال.
  - أصبح التحجيم التلقائي للعمّال محليًا محافظًا عمدًا الآن، كما يتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا أصلًا، بحيث تُحدث تشغيلات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
  - يضع إعداد Vitest الأساسي ملفات المشاريع/الإعدادات بوصفها `forceRerunTriggers` بحيث تبقى إعادة التشغيل في وضع التغييرات صحيحة عندما يتغير توصيل الاختبارات.
  - يحافظ الإعداد على تفعيل `OPENCLAW_VITEST_FS_MODULE_CACHE` على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع ذاكرة تخزين مؤقت واحدًا صريحًا لإجراء تحليل مباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق الملتزم ويطبع الزمن الفعلي بالإضافة إلى macOS max RSS.
- يقوم `pnpm test:perf:changed:bench -- --worktree` بقياس أداء الشجرة المتسخة الحالية عبر تمرير قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وتهيئة Vitest للجذر.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لجناح unit مع تعطيل التوازي على مستوى الملفات.

### E2E (اختبار smoke للـ Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل خرج وحدة التحكم المفصّل.
- النطاق:
  - سلوك end-to-end للـ Gateway متعدد المثيلات
  - أسطح WebSocket/HTTP، واقتران العقد، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عندما يكون مفعّلًا في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار smoke للخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ Gateway OpenShell معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` الحقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات canonical البعيد عبر جسر نظام ملفات sandbox
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى daemon Docker عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل جناح e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو نص wrapper

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج بالفعل _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغيّرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر بطبيعته في CI (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية مضيقة بدلًا من "كل شيء"
- تستورد تشغيلات live الملف `~/.profile` لاكتشاف مفاتيح API المفقودة.
- افتراضيًا، لا تزال تشغيلات live تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تركيبات unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات live دليل المنزل الحقيقي لديك.
- يستخدم `pnpm test:live` الآن وضعًا أكثر هدوءًا افتراضيًا: فهو يحتفظ بمخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات تمهيد Gateway وضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا كنت تريد استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند الاستجابات المرتبطة بحد المعدل.
- مخرجات التقدّم/الـ Heartbeat:
  - تصدر أجنحة live الآن أسطر التقدّم إلى stderr بحيث تظهر استدعاءات المزوّد الطويلة وكأنها نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض Vitest لوحدة التحكم بحيث تُبث أسطر تقدّم المزوّد/الـ Gateway فورًا أثناء تشغيلات live.
  - اضبط Heartbeat النموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الـ Gateway/المجسّ باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي جناح يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "البوت الخاص بي متعطل" / الإخفاقات الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` على مجموعة فرعية مضيقة

## Live: مسح قدرات Android Node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** من Android Node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا يقوم الجناح بتثبيت التطبيق أو تشغيله أو إقرانه).
  - تحقق `node.invoke` على مستوى Gateway لكل أمر بالنسبة إلى Android Node المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل مع Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [Android App](/ar/platforms/android)

## Live: اختبار smoke للنموذج (مفاتيح profile)

تنقسم اختبارات live إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- يخبرنا "النموذج المباشر" ما إذا كان المزوّد/النموذج قادرًا على الإجابة أصلًا باستخدام المفتاح المحدد.
- يخبرنا "اختبار smoke للـ Gateway" ما إذا كان مسار Gateway+الوكيل الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات منع تراجع موجهة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فسيتم تخطيه للإبقاء على تركيز `pnpm test:live` على اختبار smoke للـ Gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن profiles وبدائل البيئة
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profiles** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" و"مسار وكيل الـ Gateway معطل"
  - يحتوي على اختبارات منع تراجع صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses reasoning replay + تدفقات استدعاء الأدوات)

### الطبقة 2: اختبار smoke للـ Gateway + وكيل dev (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - تكرار النماذج التي لها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (مجس `read`)
    - مجسّات أدوات إضافية اختيارية (مجس `exec+read`)
    - استمرار عمل مسارات منع التراجع الخاصة بـ OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسّات (حتى تتمكن من شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل أن يقرأه باستخدام `read` ثم يعيد nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة nonce في ملف مؤقت، ثم قراءته مجددًا.
  - مجس الصور: يرفق الاختبار صورة PNG مولدة (قطة + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح Gateway modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين (تجنب "كل شيء في OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون مجسّات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - مجس `read` + مجس `exec+read` (ضغط على الأدوات)
  - يعمل مجس الصور عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار صورة PNG صغيرة تحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسلها عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرّر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: يُسمح بأخطاء طفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار smoke لخلفية CLI ‏(Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام خلفية CLI محلية، من دون لمس إعدادك الافتراضي.
- توجد إعدادات smoke الافتراضية الخاصة بكل خلفية داخل تعريف `cli-backend.ts` التابع للامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/المعاملات/الصور من بيانات تعريف Plugin الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجّه).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كمعاملات CLI بدلًا من حقنها في الموجّه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير معاملات الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل مجس الاستمرارية الافتراضي داخل الجلسة نفسها من Claude Sonnet إلى Opus (اضبطه على `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

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
- يشغّل اختبار smoke لخلفية CLI الحي داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحلّل بيانات تعريف smoke الخاصة بـ CLI من الامتداد المالك، ثم يثبت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا نجاح `claude -p` مباشرة داخل Docker، ثم يشغّل دورتين لخلفية CLI في Gateway من دون الحفاظ على متغيرات بيئة مفاتيح API الخاصة بـ Anthropic. يعطّل هذا المسار الخاص بالاشتراك افتراضيًا مجسّات Claude MCP/الأدوات والصور لأن Claude يوجّه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافي بدلًا من حدود خطة الاشتراك العادية.
- يمارس اختبار smoke لخلفية CLI الحي الآن التدفق end-to-end نفسه لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صور، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر CLI الخاصة بالـ Gateway.
- يقوم اختبار smoke الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## Live: اختبار smoke لربط ACP ‏(`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP باستخدام وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على نفس المحادثة
  - التحقق من أن المتابعة تصل إلى transcript جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لأمر `pnpm test:live ...` المباشر: `claude`
  - القناة الاصطناعية: سياق محادثة على نمط الرسائل الخاصة في Slack
  - خلفية ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في الـ Gateway مع حقول synthetic originating-route إدارية فقط، بحيث يمكن للاختبارات إرفاق سياق قناة الرسائل من دون الادعاء بأنها تسلّم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` للوكلاء المحددين في harness الخاصة بـ ACP.

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
- افتراضيًا، يشغّل اختبار smoke الخاص بربط ACP مقابل جميع وكلاء CLI الحيين المدعومين بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات بيئة المزوّد من profile المستورد متاحة لـ CLI الفرعية في harness.

## Live: اختبار smoke لـ Codex app-server harness

- الهدف: التحقق من harness الخاص بـ Codex والمملوك للـ Plugin عبر
  طريقة `agent` العادية في الـ Gateway:
  - تحميل Plugin المضمّن `codex`
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل عبر Gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة
    app-server يمكنها الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- مجس صور اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مجس MCP/أداة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط اختبار smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا
  ينجح harness Codex المعطّل عبر الرجوع بصمت إلى PI.
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
- يقوم باستيراد `~/.profile` المركّب، ويمرّر `OPENAI_API_KEY`، وينسخ ملفات
  مصادقة Codex CLI عند توفرها، ويثبت `@openai/codex` في بادئة npm مركّبة
  قابلة للكتابة، ويجهّز شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker مجسّات الصور وMCP/الأدوات افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق
  إعداد الاختبار الحي بحيث لا يتمكن fallback إلى `openai-codex/*` أو PI من
  إخفاء اختبار منع تراجع في Codex harness.

### وصفات live الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل تذبذبًا:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار smoke للـ Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- التركيز على Google ‏(مفتاح Gemini API + Antigravity):
  - Gemini ‏(مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth ‏(نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلية على جهازك (مع مصادقة منفصلة وخصوصيات مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مصادقة مفتاح API / profile)؛ وهذا ما يقصده معظم المستخدمين عند قول "Gemini".
  - CLI: يقوم OpenClaw باستدعاء ملف `gemini` ثنائي محلي؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (الدفق/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (لأن live اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير تتوفر فيه المفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع استمرار عمله:

- OpenAI ‏(غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google ‏(Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google ‏(Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI ‏(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار smoke للـ Gateway مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزوّدين:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI ‏(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يدعم "الأدوات" لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

أدرج نموذجًا واحدًا على الأقل يدعم الصور داخل `OPENCLAW_LIVE_GATEWAY_MODELS` ‏(Claude/Gemini/OpenAI ذات المتغيرات القادرة على الرؤية، إلخ) لممارسة مجس الصور.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` ‏(مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات+الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go ‏(المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك تضمينهم في مصفوفة live ‏(إذا كانت لديك بيانات اعتماد/إعدادات):

- مضمّنون: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` ‏(نقاط نهاية مخصصة): `minimax` ‏(سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic ‏(LM Studio أو vLLM أو LiteLLM، إلخ)

نصيحة: لا تحاول تثبيت "كل النماذج" بشكل صلب في الوثائق. القائمة المرجعية هي أي شيء تعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُثبت أبدًا)

تكتشف اختبارات live بيانات الاعتماد بالطريقة نفسها التي يعمل بها CLI. الدلالات العملية:

- إذا كان CLI يعمل، فيجب أن تعثر اختبارات live على المفاتيح نفسها.
- إذا قال اختبار live "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- Profiles المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ "مفاتيح profile" في اختبارات live)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يتم نسخه إلى home الحي المجهّز عند توفره، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تقوم تشغيلات live المحلية افتراضيًا بنسخ الإعداد النشط وملفات `auth-profiles.json` لكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى home اختبار مؤقت؛ وتتجاوز homes الحية المجهّزة `workspace/` و`sandboxes/`، كما تُجرّد تجاوزات المسار `agents.*.workspace` و`agentDir` بحيث تبقى المجسّات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح البيئة (مثل المفاتيح المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live ‏(تفريغ الصوت إلى نص)

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
  - يمارس مسارات comfy المضمّنة للصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم يتم ضبط `models.providers.comfy.<capability>`
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستطلاع أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugins مزوّدات توليد الصور المسجّلة
  - يحمّل متغيرات بيئة المزوّد المفقودة من shell تسجيل الدخول لديك (`~/.profile`) قبل إجراء المجسّات
  - يستخدم مفاتيح API الحية/المعتمدة على البيئة قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا توجد لديهم مصادقة/ profile / نموذج قابل للاستخدام
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل التجاوزات المعتمدة على البيئة فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّدات توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل إجراء المجسّات
  - يستخدم مفاتيح API الحية/المعتمدة على البيئة قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا توجد لديهم مصادقة/ profile / نموذج قابل للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يعتمد على الموجّه فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate`، `edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy live منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل التجاوزات المعتمدة على البيئة فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- النطاق:
  - يمارس مسار مزوّدات توليد الفيديو المضمّن المشترك
  - يستخدم افتراضيًا مسار smoke آمنًا للإصدار: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، وموجّه lobster لمدة ثانية واحدة، وحدًّا أقصى لكل عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` ‏(`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور لدى المزوّد قد يهيمن على زمن الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات بيئة المزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل إجراء المجسّات
  - يستخدم مفاتيح API الحية/المعتمدة على البيئة قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا توجد لديهم مصادقة/ profile / نموذج قابل للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المدعوم بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المدعوم بالمخزن المؤقت في المسح المشترك
  - المزوّدون المعلَنون حاليًا لكن المتخطَّون لـ `imageToVideo` في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - التغطية الخاصة بالمزوّد Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` لـ text-to-video بالإضافة إلى مسار `kling` يستخدم افتراضيًا fixture لعنوان URL صورة بعيدة
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون المعلَنون حاليًا لكن المتخطَّون لـ `videoToVideo` في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لعمليات video inpaint/remix
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لكل عملية مزوّد من أجل تشغيل smoke صارم
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل التجاوزات المعتمدة على البيئة فقط

## Media live harness

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل أجنحة live المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات بيئة المزوّد المفقودة من `~/.profile`
  - يضيّق تلقائيًا كل جناح إلى المزوّدين الذين لديهم مصادقة قابلة للاستخدام حاليًا افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (فحوصات "يعمل على Linux" الاختيارية)

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: `test:docker:live-models` و`test:docker:live-gateway` تشغّلان فقط ملف live المطابق لمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حد smoke أصغر بحيث يبقى المسح الكامل داخل Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة تلك عندما
  تريد صراحةً إجراء المسح الأشمل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغّلات smoke للحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` تقوم بتشغيل حاوية أو أكثر فعلية وتتحقق من مسارات تكامل أعلى مستوى.

تقوم مشغّلات Docker للنماذج الحية أيضًا بعمل bind-mount فقط لـ homes مصادقة CLI المطلوبة (أو كلها المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل بحيث يمكن لـ OAuth الخاص بـ CLI الخارجي تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` ‏(السكربت: `scripts/test-live-models-docker.sh`)
- اختبار smoke لربط ACP: `pnpm test:docker:live-acp-bind` ‏(السكربت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار smoke لخلفية CLI: `pnpm test:docker:live-cli-backend` ‏(السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار smoke لـ Codex app-server harness: `pnpm test:docker:live-codex-harness` ‏(السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: `pnpm test:docker:live-gateway` ‏(السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار smoke حي لـ Open WebUI: `pnpm test:docker:openwebui` ‏(السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج Onboarding ‏(TTY، البناء الكامل): `pnpm test:docker:onboard` ‏(السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway ‏(حاويتان، مصادقة WS + السلامة): `pnpm test:docker:gateway-network` ‏(السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP ‏(Gateway مزروع + جسر stdio + اختبار smoke خام لإطارات إشعارات Claude): `pnpm test:docker:mcp-channels` ‏(السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins ‏(اختبار smoke للتثبيت + الاسم البديل `/plugin` + دلالات إعادة تشغيل Claude-bundle): `pnpm test:docker:plugins` ‏(السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغّلات Docker للنماذج الحية أيضًا بعمل bind-mount للإصدار الحالي read-only من
نسخة العمل لديك وتجهّزه داخل دليل عمل مؤقت داخل الحاوية. هذا يبقي صورة وقت التشغيل
نحيفة بينما يظل يشغّل Vitest على المصدر/الإعداد المحليين الدقيقين لديك.
تتخطى خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات `.build` المحلية للتطبيق أو
مجلدات إخراج Gradle، حتى لا تقضي تشغيلات Docker live دقائق في نسخ
الملفات الخاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` بحيث لا تبدأ مجسّات Gateway الحية
عمّال قنوات Telegram/Discord/... حقيقية داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
يُعد `test:docker:openwebui` اختبار smoke أعلى مستوى للتوافق: فهو يبدأ
حاوية Gateway لـ OpenClaw مع تفعيل نقاط النهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة مقابل ذلك الـ Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد تحتاج Open WebUI إلى إكمال إعداد البدء البارد الخاص بها.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
‏(`~/.profile` افتراضيًا) الوسيلة الأساسية لتوفيره في تشغيلات Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
يُعد `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مزروعة، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحي، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات على نمط Claude عبر جسر stdio MCP الحقيقي. ويفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرةً بحيث يتحقق smoke مما يصدره الجسر
فعليًا، وليس فقط مما قد تكشفه مجموعة أدوات SDK لعميل محدد.

اختبار smoke يدوي لخيط ACP بلغة طبيعية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لسير عمل اختبارات منع التراجع/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` ‏(الافتراضي: `~/.openclaw`) يتم تركيبه إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` ‏(الافتراضي: `~/.openclaw/workspace`) يتم تركيبه إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` ‏(الافتراضي: `~/.profile`) يتم تركيبه إلى `/home/node/.profile` ويتم استيراده قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات البيئة فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ودون أي تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يتم تركيبه إلى `/home/node/.npm-global` من أجل تثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم التشغيلات المضيقة للمزوّد بتركيب الأدلة/الملفات المطلوبة فقط كما يُستنتج من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - يمكن التجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة للتشغيلات المتكررة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن profiles ‏(وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه الـ Gateway لاختبار Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجّه التحقق من nonce المستخدم في اختبار Open WebUI smoke
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## التحقق من سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديل المستندات: `pnpm check:docs`.
شغّل التحقق الكامل من روابط Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار منع التراجع دون اتصال (آمن لـ CI)

هذه اختبارات منع تراجع لـ "مسار حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات الـ Gateway ‏(mock OpenAI، وGateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` ‏(الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(‏WS `wizard.start`/`wizard.next`، ويفرض كتابة config + auth): `src/gateway/gateway.test.ts` ‏(الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمية عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات المعالج end-to-end التي تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا بالنسبة إلى Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجّه، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/المعاملات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءة ملفات Skill، وتوصيل الجلسة.
- جناح صغير من السيناريوهات المركزة على Skills ‏(الاستخدام مقابل التجنب، والبوابات، وحقن الموجّه).
- تقييمات live اختيارية (اختيارية ومحكومة بمتغيرات البيئة) فقط بعد وضع الجناح الآمن لـ CI في مكانه.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاص بهما. فهي تكرّر عبر جميع Plugins المكتشفة وتشغّل مجموعة من
التحققات الخاصة بالشكل والسلوك. يتخطى مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالواجهات وملفات smoke؛ شغّل أوامر العقود
صراحةً عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin ‏(المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف السلسلة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسّات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدين

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API فهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير عمليات التصدير أو المسارات الفرعية في plugin-sdk
- بعد إضافة أو تعديل Plugin قناة أو مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات منع التراجع (إرشادات)

عندما تصلح مشكلة في مزوّد/نموذج تم اكتشافها في live:

- أضف اختبار منع تراجع آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها live-only ‏(حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في مسار Gateway الخاص بالجلسة/السجل/الأدوات → اختبار smoke حي للـ Gateway أو اختبار mock آمن لـ CI خاص بالـ Gateway
- حاجز حماية لاجتياز SecretRef:
  - يستخدم `src/secrets/exec-secret-ref-id-parity.test.ts` قيمة مستهدفة مُعيّنة واحدة لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يتم تجاوز الفئات الجديدة بصمت.

---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، مشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-23T14:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration و e2e و live) ومجموعة صغيرة من مشغّلات Docker.

هذه الوثيقة هي دليل “كيف نختبر”:

- ما الذي تغطيه كل مجموعة (وما الذي لا تغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات انحدار لمشكلات النماذج/المزوّدين في العالم الحقيقي

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقع قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع محليًا للمجموعة الكاملة على جهاز بموارد جيدة: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يمر الآن أيضًا عبر مسارات الإضافات/القنوات: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات الموجّهة أولًا عندما تعمل على تكرار إصلاح فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (فحوصات النماذج + أدوات/صور Gateway): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- فحص شامل حي للنماذج عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورة نصية بالإضافة إلى فحص صغير بأسلوب قراءة الملفات.
    وتشغّل النماذج التي تعلن بياناتها الوصفية عن إدخال `image` أيضًا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال المزوّد.
  - تغطية CI: كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية تستدعيان سير العمل القابل لإعادة الاستخدام live/E2E مع
    `include_live_suites: true`، والذي يتضمن وظائف مصفوفة منفصلة لنماذج Docker الحية
    موزعة حسب المزوّد.
  - لإعادة التشغيل المركزة في CI، أرسل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزوّدين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/مستدعي الإصدار.
- فحص تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  معزولًا مقابل `moonshot/kimi-k2.6`. تحقّق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  سجل المحادثة الخاص بالمساعد يخزن `usage.cost` المطبّع.

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، ففضّل تضييق الاختبارات الحية عبر متغيرات البيئة الخاصة بقائمة السماح الموصوفة أدناه.

## مشغّلات خاصة بـ QA

توجد هذه الأوامر إلى جانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

يشغّل CI مختبر QA في مسارات عمل مخصصة. تعمل `Parity gate` على طلبات السحب المطابقة
ومن الإرسال اليدوي مع مزوّدين وهميين. تعمل `QA-Lab - All Lanes` ليلًا على
`main` ومن الإرسال اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومسار Telegram الحي المُدار عبر Convex كوظائف متوازية. وتشغّل `OpenClaw Release Checks`
المسارات نفسها قبل الموافقة على الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين. يستخدم `qa-channel` افتراضيًا توازيًا قدره 4 (مقيّدًا بعدد السيناريوهات المحددة).
    استخدم `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بحالة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الحصول على المخرجات دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و `mock-openai` و `aimock`.
    يقوم `aimock` بتشغيل خادم مزوّد محلي مدعوم بـ AIMock لتغطية تجريبية للتركيبات والمحاكاة على مستوى البروتوكول دون استبدال المسار `mock-openai` المعتمد على السيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة عبر Multipass.
  - يحتفظ بالسلوك نفسه لاختيار السيناريو كما في `qa suite` على المضيف.
  - يعيد استخدام إشارات اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على البيئة، ومسار إعدادات مزوّد QA الحي، و `CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج تحت جذر المستودع لكي يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركّبة.
  - يكتب تقرير QA العادي + الملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من النسخة الحالية، ويثبته عموميًا داخل Docker، ويشغّل
    onboarding غير تفاعليًا باستخدام مفتاح OpenAI API، ويضبط Telegram
    افتراضيًا، ويتحقق من أن تفعيل Plugin يثبت تبعيات وقت التشغيل عند الطلب،
    ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة مقابل نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار
    التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:bundled-channel-deps`
  - يعبّئ ويثبت نسخة OpenClaw الحالية داخل Docker، ويشغّل Gateway
    مع إعداد OpenAI، ثم يفعّل القناة/Plugins المضمّنة عبر
    تعديلات على الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات وقت تشغيل Plugin غير المضبوطة
    غير موجودة، وأن أول تشغيل مضبوط لـ Gateway أو doctor يثبت
    تبعيات وقت التشغيل لكل Plugin مضمّن عند الطلب، وأن إعادة تشغيل ثانية لا
    تعيد تثبيت التبعيات التي فُعّلت بالفعل.
  - يثبت أيضًا أساس npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    إصلاحات doctor بعد التحديث في الإصدار المرشح تعالج تبعيات وقت تشغيل القنوات المضمّنة
    دون إصلاح postinstall من جهة حزمة الاختبار.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار أولي مباشر على مستوى البروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم منزلي Tuwunel مؤقت مدعوم بـ Docker.
  - مضيف QA هذا مخصص للمستودع/التطوير فقط حاليًا. لا تشحن تثبيتات OpenClaw المعبأة
    `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تحمّل نسخ المستودع المشغّل المضمّن مباشرة؛ ولا حاجة إلى خطوة منفصلة لتثبيت Plugin.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix (`driver` و `sut` و `observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA gateway مع Plugin Matrix الحقيقي كوسيلة نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix عن إشارات مصدر بيانات اعتماد مشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير QA لـ Matrix، والملخص، ومخرجات observed-events، وسجل إخراج stdout/stderr المدمج تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بـ driver و SUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات اعتماد مشتركة مجمّعة. استخدم وضع البيئة افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجير المجمع.
  - يخرج بحالة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات دون رمز خروج فاشل.
  - يتطلب botين مختلفين داخل المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT لاسم مستخدم Telegram.
  - للحصول على ملاحظة مستقرة بين bot وآخر، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن bot الخاص بـ driver يمكنه ملاحظة حركة bots داخل المجموعة.
  - يكتب تقرير QA لـ Telegram، والملخص، ومخرجات observed-messages تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب الإرسال الخاص بـ driver إلى الرد المرصود من SUT.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA تركيبية واسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار | Canary | بوابة الإشارة | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة سلسلة المحادثة | عزل سلسلة المحادثة | ملاحظة التفاعلات | أمر المساعدة |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار 1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) من أجل
`openclaw qa telegram`، يحصل qa-lab على تأجير حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لهذا التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف.

مرجع هيكل مشروع Convex:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - البيئة الافتراضية: `OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يتيح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` عناوين URL الخاصة بـ Convex عبر `http://` على local loopback لأغراض التطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على إخراج قابل للقراءة آليًا في السكربتات وأدوات CI.

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
- `POST /admin/add` (سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حماية التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمي.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المبني على Markdown أمرين فقط بالضبط:

1. مُهايئ نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا على المستوى الأعلى عندما يمكن للمضيف المشترك `qa-lab`
أن يتولى هذا التدفق.

يتولى `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- توازي العمّال
- كتابة المخرجات
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins الخاصة بالمشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية ضبط Gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية كشف النصوص وسياق النقل المطبّع
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ مشغّل النقل على واجهة المضيف المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة القناة.
4. تركيب المشغّل على هيئة `openclaw qa <runner>` بدلًا من تسجيل جذر أمر منافس.
   يجب أن تعلن Plugins الخاصة بالمشغّل `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ يجب أن يبقى CLI الكسول وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown ضمن الأدلة ذات الطابع `qa/scenarios/`.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه داخل Plugin ذلك المشغّل أو حزمة Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة واحدة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

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

تظل أسماء التوافق البديلة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة الخاصة بالقنوات أسماء المساعدات العامة.
توجد أسماء التوافق البديلة لتجنب ترحيل شامل دفعة واحدة، وليس كنموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكر في المجموعات على أنها “تزايد في الواقعية” (وتزايد في قابلية التعطل/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الأجزاء `vitest.full-*.config.ts` وقد توسّع الأجزاء متعددة المشاريع إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و `packages/**/*.test.ts` و `test/**/*.test.ts` واختبارات `ui` الخاصة بـ node المدرجة في قائمة السماح والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن اثني عشر إعداد جزء أصغر (`core-unit-fast` و `core-unit-src` و `core-unit-security` و `core-unit-ui` و `core-unit-support` و `core-support-boundary` و `core-contracts` و `core-bundled` و `core-runtime` و `agentic` و `auto-reply` و `extensions`) بدلًا من عملية جذر مشروع أصلية واحدة ضخمة. هذا يقلل ذروة RSS على الأجهزة المزدحمة ويتجنب أن يستهلك عمل auto-reply/extension موارد المجموعات غير ذات الصلة.
  - ما يزال `pnpm test --watch` يستخدم مخطط المشاريع الأصلي للجذر `vitest.config.ts`، لأن حلقة مراقبة متعددة الأجزاء غير عملية.
  - يوجّه `pnpm test` و `pnpm test:watch` و `pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات محددة أولًا، لذلك فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة الإقلاع الكاملة لمشروع الجذر.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه؛ وما تزال تعديلات الإعداد/التهيئة تعود إلى إعادة تشغيل واسعة لمشروع الجذر.
  - `pnpm check:changed` هو البوابة المحلية الذكية المعتادة للأعمال الضيقة. فهو يصنف الفرق إلى core واختبارات core و extensions واختبارات extension و apps و docs وبيانات الإصدار وأدوات العمل، ثم يشغّل مسارات typecheck/lint/test المطابقة. تتضمن تغييرات Plugin SDK العامة وعقد Plugin تحققًا من extensions لأن extensions تعتمد على تلك العقود الأساسية. أما زيادات رقم الإصدار فقط ضمن بيانات الإصدار فتمر عبر فحوصات مستهدفة للإصدار/الإعداد/تبعيات الجذر بدلًا من المجموعة الكاملة، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار الأعلى مستوى.
  - تمر اختبارات unit الخفيفة الاستيراد من agents و commands و plugins ومساعدات auto-reply و `plugin-sdk` ومناطق الأدوات الخالصة المشابهة عبر المسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة من حيث الحالة/وقت التشغيل على المسارات الحالية.
  - تُعيّن بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و `commands` أيضًا تشغيلات الوضع المتغير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - يملك `auto-reply` الآن ثلاث سلال مخصصة: مساعدات core على المستوى الأعلى، واختبارات integration ذات المستوى الأعلى `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يبقي أثقل أعمال حزمة الرد بعيدًا عن اختبارات الحالة/الجزء/الرمز الرخيصة.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction،
    فحافظ على كلا مستويي التغطية.
  - أضف اختبارات انحدار مركزة للمساعدات عند حدود التوجيه/التطبيع الخالصة.
  - وأبقِ أيضًا مجموعات integration الخاصة بالمشغّل المضمّن سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المحددة والسلوك الخاص بـ Compaction ما يزالان يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تكفي اختبارات المساعدات فقط كبديل
    لهذه المسارات التكاملية.
- ملاحظة المجمع:
  - يستخدم إعداد Vitest الأساسي الآن `threads` افتراضيًا.
  - كما يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر، وإعدادات e2e و live.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - يرث كل جزء من `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل تقلبات ترجمة V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت بحاجة إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
  - يشغّل خطاف ما قبل commit الأمر `pnpm check:changed --staged` بعد التنسيق/الـ lint للملفات المجهزة، لذلك لا تدفع commits الخاصة بـ core فقط تكلفة اختبارات extension إلا إذا لمست عقودًا عامة تواجه extension. وتبقى commits الخاصة ببيانات الإصدار فقط ضمن مسار الإصدار/الإعداد/تبعيات الجذر المستهدف.
  - إذا كانت مجموعة التغييرات المجهزة الدقيقة قد تم التحقق منها بالفعل ببوابات مساوية أو أقوى، فاستخدم `scripts/committer --fast "<message>" <files...>` لتجاوز إعادة تشغيل خطاف النطاق المتغير فقط. وما يزال تنسيق/ـ lint الملفات المجهزة يعمل. اذكر البوابات المكتملة في التسليم. ويُقبل هذا أيضًا بعد إعادة تشغيل فشل متقلب معزول في الخطاف ونجاحه مع دليل محدد النطاق.
  - يوجّه `pnpm test:changed` عبر مسارات محددة عندما تُطابق المسارات المتغيرة مجموعة أصغر بوضوح.
  - يحافظ `pnpm test:max` و `pnpm test:changed:max` على سلوك التوجيه نفسه، فقط مع حد أعلى أكبر للعمّال.
  - أصبح التدرج التلقائي المحلي للعمّال محافظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تُحدث تشغيلات Vitest المتعددة المتزامنة ضررًا أقل افتراضيًا.
  - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعداد باعتبارها `forceRerunTriggers` بحيث تبقى إعادة التشغيل في الوضع المتغير صحيحة عندما تتغير توصيلات الاختبار.
  - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع ذاكرة تخزين مؤقت صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest بالإضافة إلى إخراج تفصيلي للاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه والمسار الأصلي لمشروع الجذر لذلك الفرق الملتزم ويطبع زمن التنفيذ بالإضافة إلى أقصى RSS على macOS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` أداء الشجرة الحالية المتسخة عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف بدء Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، ومفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر local loopback مع تمكين التشخيصات افتراضيًا
  - يمرر تقلّبات اصطناعية لرسائل gateway والذاكرة والحمولات الكبيرة عبر مسار الأحداث التشخيصي
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى ضمن الحدود، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة اختبارات انحدار الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (اختبار Gateway دخاني)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و `test/**/*.e2e.test.ts` واختبارات E2E الخاصة بالـ Plugin المضمّن تحت `extensions/`
- إعدادات وقت التشغيل الافتراضية:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا متكيفين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل حمل I/O على وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين إخراج وحدة التحكم المفصل.
- النطاق:
  - سلوك gateway متعدد النسخ من طرف إلى طرف
  - أسطح WebSocket/HTTP، واقتران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط التنفيذ)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار OpenShell الخلفي الدخاني

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوقًا معزولًا من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية لـ OpenClaw OpenShell عبر `sandbox ssh-config` + تنفيذ SSH حقيقيين
  - يتحقق من سلوك نظام الملفات البعيد-المعياري عبر جسر نظام ملفات الصندوق المعزول
- التوقعات:
  - يعمل بالاشتراك فقط؛ وليس جزءًا من التشغيل الافتراضي `pnpm test:e2e`
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر Gateway الاختباري والصندوق المعزول
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI تنفيذي غير افتراضي أو سكربت wrapper

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و `test/**/*.live.test.ts` واختبارات live الخاصة بالـ Plugin المضمّن تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - “هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ مع بيانات اعتماد حقيقية؟”
  - التقاط تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI بطبيعته (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من “كل شيء”
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تركيبات unit من تعديل `~/.openclaw` الحقيقي.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل المنزل الحقيقي لديك.
- يستخدم `pnpm test:live` الآن وضعًا أكثر هدوءًا افتراضيًا: فهو يبقي مخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع Gateway/ضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات الإقلاع الكاملة.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق مفصول بفواصل/فواصل منقوطة أو `*_API_KEY_1` و `*_API_KEY_2` (مثل `OPENAI_API_KEYS` و `ANTHROPIC_API_KEYS` و `GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر المجموعات الحية الآن أسطر التقدم إلى stderr بحيث تبقى استدعاءات المزوّد الطويلة مرئية النشاط حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ Gateway/الفحوصات باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (و `pnpm test:coverage` إذا غيّرت كثيرًا)
- عند لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح “البوت الخاص بي متعطل” / الأعطال الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيقًا

## Live: فحص قدرات Android Node الشامل

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** بواسطة Android Node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تقوم المجموعة بتثبيت التطبيق أو تشغيله أو إقرانه).
  - تحقق `node.invoke` في Gateway لكل أمر بالنسبة إلى Android Node المحدد.
- الإعداد المسبق المطلوب:
  - يجب أن يكون تطبيق Android متصلًا ومقترنًا بـ gateway بالفعل.
  - يجب إبقاء التطبيق في الواجهة الأمامية.
  - يجب منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار دخاني للنموذج (مفاتيح profile)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الأعطال:

- يوضح “النموذج المباشر” ما إذا كان المزوّد/النموذج قادرًا أصلًا على الرد بالمفتاح المعطى.
- ويوضح “اختبار Gateway الدخاني” ما إذا كان خط Gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة الصندوق المعزول، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات انحدار موجهة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها للإبقاء على تركيز `pnpm test:live` على اختبار Gateway الدخاني
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، و GPT-5.x + Codex، و Gemini 3، و GLM 4.7، و MiniMax M2.7، و Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا عالي الإشارة ومنسقًا بعناية؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: من مخزن profile وبدائل البيئة
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profile** فقط
- سبب وجود ذلك:
  - يفصل بين “واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح” و “خط وكيل Gateway معطل”
  - يحتوي اختبارات انحدار صغيرة ومعزولة (مثال: إعادة تشغيل reasoning الخاصة بـ OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: Gateway + اختبار dev agent الدخاني (ما الذي يفعله `@openclaw` فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - التكرار على النماذج التي لها مفاتيح والتأكد من:
    - وجود رد “ذو معنى” (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (فحص read)
    - نجاح فحوصات أدوات إضافية اختيارية (فحص exec+read)
    - استمرار عمل مسارات اختبارات الانحدار الخاصة بـ OpenAI (استدعاء أداة فقط ← متابعة)
- تفاصيل الفحوصات (حتى تتمكن من شرح الأعطال بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل تنفيذ `read` له ثم إعادة nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` إلى ملف مؤقت، ثم تنفيذ `read` له مجددًا.
  - فحص الصورة: يرفق الاختبار PNG مولدة (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، و GPT-5.x + Codex، و Gemini 3، و GLM 4.7، و MiniMax M2.7، و Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح Gateway الحديثة/all افتراضيًا حدًا عالي الإشارة ومنسقًا بعناية؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين (تجنب “كل شيء في OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- فحوصات الأدوات + الصور تكون مفعلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (ضغط أدوات)
  - يعمل فحص الصورة عندما يعلن النموذج عن دعم إدخال الصورة
  - التدفق (مستوى عالٍ):
    - يولّد الاختبار PNG صغيرة مع “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسلها عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: يُسمح بأخطاء طفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار دخاني للواجهة الخلفية CLI (Claude أو Codex أو Gemini أو CLIات محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس الإعداد الافتراضي لديك.
- توجد الإعدادات الافتراضية للاختبار الدخاني الخاصة بكل واجهة خلفية داخل تعريف `cli-backend.ts` الخاص بالإضافة المالكة.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات التعريف الخاصة بواجهة CLI الخلفية في Plugin المالك.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الـ prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من الحقن في الـ prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي لنفس الجلسة من Claude Sonnet إلى Opus (اضبطه إلى `1` لفرض تشغيله عندما يدعم النموذج المحدد هدف تبديل).

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
- يشغّل الاختبار الحي الدخاني للواجهة الخلفية CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذري.
- يحلّل بيانات تعريف الاختبار الدخاني CLI من الإضافة المالكة، ثم يثبت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth المحمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورتين لواجهة Gateway الخلفية CLI من دون الاحتفاظ بمتغيرات البيئة الخاصة بمفتاح Anthropic API. ويعطّل هذا المسار الخاص بالاشتراك افتراضيًا فحوصات Claude MCP/tool والصورة لأن Claude يمرر استخدام تطبيقات الجهات الخارجية حاليًا عبر فوترة استخدام إضافي بدلًا من حدود خطة الاشتراك العادية.
- يختبر الاختبار الحي الدخاني للواجهة الخلفية CLI الآن نفس التدفق الكامل من طرف إلى طرف لـ Claude و Codex و Gemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة MCP `cron` تم التحقق منه عبر Gateway CLI.
- يقوم الاختبار الدخاني الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: اختبار ACP bind الدخاني (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل تركيبية في موضعها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى سجل جلسة ACP المرتبطة
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لتشغيل `pnpm test:live ...` المباشر: `claude`
  - القناة التركيبية: سياق محادثة بأسلوب الرسائل الخاصة في Slack
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول originating-route تركيبية مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل دون الادعاء بالتسليم الخارجي.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` المضمّن للوكيل المحدد في حزمة ACP.

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
- افتراضيًا، يشغّل اختبار ACP bind الدخاني على جميع وكلاء CLI الحية المدعومة بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان غير موجود.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات بيئة المزوّد المستوردة من profile متاحة لـ CLI التابع للحزمة.

## Live: اختبار حزمة Codex app-server الدخاني

- الهدف: التحقق من حزمة Codex المملوكة لـ Plugin عبر
  طريقة `agent` العادية في gateway:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل عبر gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة app-server
    يمكنها الاستئناف
  - تشغيل `/codex status` و `/codex models` عبر مسار أمر gateway نفسه
  - تشغيل اختياري لفحصين shell مُصعّدين بمراجعة Guardian: أمر
    آمن يجب أن تتم الموافقة عليه، ورفع سر مزيف يجب
    رفضه لكي يطلب الوكيل التأكيد
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط الاختبار الدخاني `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا تتمكن
  حزمة Codex المعطلة من النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية من
  `~/.codex/auth.json` و `~/.codex/config.toml`

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
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
  قابلة للكتابة ومركّبة، ويجهز شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker افتراضيًا فحوصات الصورة و MCP/tool و Guardian. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل
  تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق
  إعداد الاختبار الحي، بحيث لا يتمكن الرجوع إلى `openai-codex/*` أو PI من إخفاء
  اختبار انحدار في حزمة Codex.

### وصفات حية موصى بها

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
- يستخدم `google-antigravity/...` جسر Antigravity عبر OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصوصيات أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / profile)؛ وهذا ما يقصده معظم المستخدمين عند قول “Gemini”.
  - CLI: يستدعي OpenClaw ملف `gemini` التنفيذي المحلي؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (لأن live يعمل بالاشتراك)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير مع مفاتيح.

### مجموعة حديثة للاختبارات الدخانية (استدعاء الأدوات + الصور)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يظل يعمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار Gateway الدخاني مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو الأحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على `tools` ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### Vision: إرسال الصور (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتفعيل فحص الصور.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على tools+image)
- OpenCode: `opencode/...` لـ Zen و `opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك تضمينهم في مصفوفة live (إذا كانت لديك بيانات الاعتماد/الإعدادات):

- مضمّنًا: `openai` و `openai-codex` و `anthropic` و `google` و `google-vertex` و `google-antigravity` و `google-gemini-cli` و `zai` و `openrouter` و `opencode` و `opencode-go` و `xai` و `groq` و `cerebras` و `mistral` و `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وسيط متوافق مع OpenAI/Anthropic (مثل LM Studio و vLLM و LiteLLM، إلخ)

نصيحة: لا تحاول ترميز “كل النماذج” بشكل ثابت في الوثائق. القائمة الموثوقة هي ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُضمَّن في commit أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. والنتائج العملية لذلك:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي “لا توجد بيانات اعتماد”، فقم بالتصحيح بالطريقة نفسها التي كنت ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات profile للمصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا ما تعنيه “مفاتيح profile” في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى منزل live المرحلي عند وجوده، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تقوم التشغيلات الحية المحلية افتراضيًا بنسخ الإعداد النشط وملفات `auth-profiles.json` الخاصة بكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت؛ وتتجاوز منازل live المرحلية `workspace/` و `sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` / `agentDir` حتى تبقى الفحوصات بعيدًا عن مساحة العمل الحقيقية على المضيف.

إذا أردت الاعتماد على مفاتيح البيئة (مثلًا المصدَّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (نسخ صوتي)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التمكين: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus الحية

- الاختبار: `extensions/byteplus/live.test.ts`
- التمكين: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز نموذج اختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI الحية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصورة والفيديو و `music_generate` المضمّنة في comfy
  - يتجاوز كل قدرة ما لم تكن `models.providers.comfy.<capability>` مضبوطة
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستطلاع، أو التنزيلات، أو تسجيل Plugin

## توليد الصور live

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزمة: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد لتوليد الصور مسجل
  - يحمّل متغيرات البيئة الناقصة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بالبيئة قبل ملفات profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتجاوز المزوّدين الذين لا يملكون مصادقة/ profile/ نموذجًا صالحًا للاستخدام
  - يشغّل متغيرات توليد الصور الأساسية عبر القدرة المشتركة لوقت التشغيل:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون المشمولون حاليًا:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن profile وتجاهل التجاوزات المعتمدة فقط على البيئة

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media music`
- النطاق:
  - يختبر المسار المشترك المضمّن لمزوّد توليد الموسيقى
  - يغطي حاليًا Google و MiniMax
  - يحمّل متغيرات البيئة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بالبيئة قبل ملفات profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتجاوز المزوّدين الذين لا يملكون مصادقة/ profile/ نموذجًا صالحًا للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد فقط على prompt
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن profile وتجاهل التجاوزات المعتمدة فقط على البيئة

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media video`
- النطاق:
  - يختبر المسار المشترك المضمّن لمزوّد توليد الفيديو
  - يستخدم افتراضيًا مسار الاختبار الدخاني الآمن للإصدار: مزوّدون غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر لمدة ثانية واحدة، وحد عمليات لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتجاوز FAL افتراضيًا لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على زمن الإصدار؛ مرر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات البيئة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بالبيئة قبل ملفات profile المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتجاوز المزوّدين الذين لا يملكون مصادقة/ profile/ نموذجًا صالحًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية معتمدًا على buffer ضمن المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي معتمدًا على buffer ضمن المسح المشترك
  - المزوّدون الحاليون المعلنون لكن المتجاوزون في `imageToVideo` ضمن المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصّي فقط و`kling` المضمّن يتطلب عنوان URL بعيدًا للصورة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` text-to-video بالإضافة إلى مسار `kling` يستخدم تركيبة عنوان URL بعيد للصورة افتراضيًا
  - التغطية الحالية الحية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون الحاليون المعلنون لكن المتجاوزون في `videoToVideo` ضمن المسح المشترك:
    - `alibaba` و `qwen` و `xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة إلى inpaint/remix للفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد العملية لكل مزوّد من أجل تشغيل دخاني أكثر شدة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة من مخزن profile وتجاهل التجاوزات المعتمدة فقط على البيئة

## حزمة الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول واحدة أصلية للمستودع
  - يحمّل تلقائيًا متغيرات البيئة الناقصة الخاصة بالمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (اختيارية لفحوصات "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و `test:docker:live-gateway` فقط ملف الاختبار الحي المطابق لمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا تم تركيبه). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و `test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حدًا أصغر للاختبار الدخاني بحيث يبقى المسح الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة تلك عندما
  تريد صراحةً المسح الشامل الأكبر.
- يقوم `test:docker:all` ببناء صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين. كما يبني صورة مشتركة واحدة لـ `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغّلات الاختبار الدخاني لحاويات E2E التي تختبر التطبيق المبني.
- مشغّلات الاختبار الدخاني للحاويات: تقوم `test:docker:openwebui` و `test:docker:onboard` و `test:docker:npm-onboard-channel-agent` و `test:docker:gateway-network` و `test:docker:mcp-channels` و `test:docker:pi-bundle-mcp-tools` و `test:docker:cron-mcp-cleanup` و `test:docker:plugins` و `test:docker:plugin-update` و `test:docker:config-reload` بتشغيل حاوية حقيقية واحدة أو أكثر والتحقق من مسارات integration أعلى مستوى.

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب مجلدات مصادقة CLI المطلوبة فقط (أو جميع المجلدات المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بـ CLI الخارجي من تحديث الرموز دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار ACP bind الدخاني: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار الواجهة الخلفية CLI الدخاني: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار حزمة Codex app-server الدخاني: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار Open WebUI الحي الدخاني: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding (TTY، إعداد كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- اختبار onboarding/channel/agent الدخاني عبر npm tarball: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت أرشيف OpenClaw المعبأ عموميًا داخل Docker، ويضبط OpenAI عبر onboarding باستخدام مرجع البيئة بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن تمكين Plugin يثبت تبعيات وقت تشغيله عند الطلب، ويشغّل doctor، ويشغّل دورة وكيل OpenAI وهمية واحدة. أعد استخدام tarball مبني مسبقًا باستخدام `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار انحدار reasoning الأدنى لميزة web_search في OpenAI Responses: يشغّل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزوّد ويتحقق من أن التفاصيل الخام تظهر في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخاني خام لإطار إشعارات Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات Pi bundle MCP (خادم MCP حقيقي عبر stdio + اختبار دخاني للسماح/المنع في profile Pi المضمّن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + إيقاف process فرعية لـ MCP عبر stdio بعد تشغيل Cron معزول وتشغيل subagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار تثبيت دخاني + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
- اختبار دخاني لعدم تغيّر تحديث Plugin: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخاني لبيانات إعادة تحميل الإعداد: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت تشغيل Plugin المضمّن: يقوم `pnpm test:docker:bundled-channel-deps` افتراضيًا ببناء صورة مشغّل Docker صغيرة، ويبني OpenClaw ويعبئه مرة واحدة على المضيف، ثم يركّب ذلك الـ tarball داخل كل سيناريو تثبيت Linux. أعد استخدام الصورة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة بناء المضيف بعد بناء محلي جديد باستخدام `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى tarball موجود باستخدام `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- ضيّق تبعيات وقت تشغيل Plugin المضمّن أثناء التكرار عبر تعطيل السيناريوهات غير ذات الصلة، على سبيل المثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء صورة التطبيق المبني المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل مجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` لها الأولوية عند ضبطها. وعندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تقوم السكربتات بسحبها إذا لم تكن موجودة محليًا بالفعل. تحتفظ اختبارات QR والمثبتات عبر Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزم/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

كما تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
وتجهيزها في workdir مؤقت داخل الحاوية. وهذا يبقي صورة وقت التشغيل
صغيرة مع الاستمرار في تشغيل Vitest على المصدر/الإعداد المحليين لديك بالضبط.
وتتجاوز خطوة التجهيز الملفات المؤقتة المحلية الكبيرة ومخرجات بناء التطبيق مثل
`.pnpm-store` و `.worktrees` و `__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
مخرجات خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ الفحوصات الحية لـ gateway
عمّال قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
ما يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من مسار Docker ذلك.
يُعد `test:docker:openwebui` اختبار توافق دخانيًا أعلى مستوى: فهو يبدأ
حاوية OpenClaw gateway مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البداية الباردة الخاص به.
يتطلب هذا المسار مفتاح نموذج حي صالحًا للاستخدام، ويعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في التشغيلات عبر Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
إن `test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مزروعة، ويبدأ حاوية ثانية تُطلق `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص، وبيانات المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي عبر stdio. ويتحقق فحص الإشعارات
من إطارات MCP الخام عبر stdio مباشرة حتى يثبت الاختبار الدخاني ما الذي
يصدره الجسر فعليًا، لا فقط ما قد تكشفه SDK عميل محدد.
إن `test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح
نموذج حي. فهو يبني صورة Docker الخاصة بالمستودع، ويشغّل خادم فحص MCP حقيقيًا
عبر stdio داخل الحاوية، ويمثّل ذلك الخادم عبر وقت تشغيل Pi bundle
MCP المضمّن، وينفذ الأداة، ثم يتحقق من أن `coding` و `messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و `tools.deny: ["bundle-mcp"]` بتصفيتها.
إن `test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح
نموذج حي. فهو يبدأ Gateway مزروعًا مع خادم فحص MCP حقيقي عبر stdio، ويشغّل
دورة cron معزولة ودورة child لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP الفرعية بعد كل تشغيل.

اختبار يدوي دخاني لسلسلة ACP بلغة طبيعية عادية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذلك لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) ويُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) ويُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) ويُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات البيئة فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و `~/.codex/config.toml` و `.claude.json` و `~/.claude/.credentials.json` و `~/.claude/settings.json` و `~/.claude/settings.local.json`
  - تقوم التشغيلات المضيقة حسب المزوّد بتركيب الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - يمكنك التجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة من أجل إعادة تشغيل لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن profile (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه gateway لاختبار Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt فحص nonce المستخدم في اختبار Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديل الوثائق: `pnpm check:docs`.
شغّل التحقق الكامل من روابط وعناوين Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار انحدار دون اتصال (آمن لـ CI)

هذه اختبارات انحدار “لخط تنفيذ حقيقي” من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، كتابة config + auth enforced): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل “تقييمات موثوقية الوكيل”:

- استدعاء أدوات وهمية عبر gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات معالج شاملة من طرف إلى طرف تتحقق من توصيل الجلسة وآثار config (`src/gateway/gateway.test.ts`).

ما يزال ينقصنا بالنسبة إلى Skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُسرد Skills في الـ prompt، هل يختار الوكيل Skill الصحيح (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود الصندوق المعزول.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتأكد من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skills، وتوصيل الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، والبوابات، وحقن الـ prompt).
- تقييمات حية اختيارية (باشتراط الاشتراك ومتغيرات البيئة) فقط بعد اكتمال المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يتوافقان مع
عقد الواجهة الخاصة بهما. فهي تكرر على جميع Plugins المكتشفة وتشغّل مجموعة من
عمليات التحقق الخاصة بالشكل والسلوك. ويتجاوز مسار unit الافتراضي `pnpm test`
هذه الملفات المشتركة الخاصة بالحدود والاختبارات الدخانية عمدًا؛ شغّل أوامر العقد صراحةً
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف السلسلة
- **directory** - واجهة API الخاصة بالدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب التشغيل

- بعد تغيير صادرات Plugin SDK أو المسارات الفرعية
- بعد إضافة Plugin قناة أو مزوّد أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات انحدار (إرشادات)

عندما تصلح مشكلة في مزوّد/نموذج تم اكتشافها في live:

- أضف اختبار انحدار آمنًا لـ CI إن أمكن (مزودًا وهميًا/بديلًا، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها خاصة بـ live فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في خط جلسة/سجل/أدوات Gateway → اختبار Gateway حي دخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز الحماية لاجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف `includeInPlan` جديدة لـ SecretRef في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تجاوز الفئات الجديدة بصمت.

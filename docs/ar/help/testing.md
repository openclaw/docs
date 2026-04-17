---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النموذج/موفّر الخدمة
    - تصحيح سلوك Gateway والوكيل
summary: 'مجموعة الاختبارات: أجنحة unit/e2e/live، ومشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-17T07:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55483bc68d3b24daca3189fba3af1e896f39b8e83068d102fed06eac05b36102
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث أجنحة Vitest (unit/integration وe2e وlive) ومجموعة صغيرة من مشغّلات Docker.

هذا المستند هو دليل "كيف نختبر":

- ما الذي يغطيه كل جناح (وما الذي لا يغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسيناريوهات العمل الشائعة (محليًا، قبل الدفع، تصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/موفّري الخدمة
- كيفية إضافة اختبارات تراجعية لمشكلات النماذج/موفّري الخدمة في العالم الحقيقي

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع محليًا للجناح الكامل على جهاز بموارد جيدة: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات مباشرة يوجّه الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكون تعمل على تكرار إصلاح فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- جناح E2E: `pnpm test:e2e`

عند تصحيح موفّري الخدمة/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- الجناح الحي (النماذج + مجسات الأدوات/الصور في Gateway): `pnpm test:live`
- استهداف ملف حي واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فاشلة واحدة، فالأفضل تضييق الاختبارات الحية عبر متغيرات البيئة الخاصة بقائمة السماح الموضحة أدناه.

## المشغّلات الخاصة بـ QA

تأتي هذه الأوامر إلى جانب أجنحة الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين، حتى 64 عاملًا أو عدد السيناريوهات المحدد. استخدم `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يدعم أوضاع موفّري الخدمة `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم موفّر خدمة محليًا مدعومًا بـ AIMock لتغطية تجريبية للتهيئات والبروتوكول الوهمي دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل جناح QA نفسه داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الموجود في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار الموفّر/النموذج نفسها الخاصة بـ `qa suite`.
  - التشغيلات الحية تمرّر مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح الموفّرين المعتمدة على البيئة، ومسار إعداد موفّر QA الحي، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى مجلدات الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مجددًا عبر مساحة العمل المركّبة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم موفّر AIMock المحلي لاختبار البروتوكول الدخاني مباشرة.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel homeserver مؤقت ومدعوم بـ Docker.
  - هذا مضيف QA مخصص للمستودع/التطوير فقط حاليًا. تثبيتات OpenClaw المعبأة لا تتضمن
    `qa-lab`، لذلك لا تعرض `openclaw qa`.
  - نسخ المستودع تحمّل المشغّل المضمّن مباشرة؛ لا حاجة إلى خطوة تثبيت Plugin منفصلة.
  - يجهّز ثلاثة مستخدمي Matrix مؤقتين (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA gateway مع Matrix plugin الحقيقي كوسيلة نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوز ذلك باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يعرّض Matrix علامات مصادر بيانات اعتماد مشتركة لأن المسار يجهّز مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA وملخصًا وقطعة أثر observed-events وسجل إخراج stdout/stderr المجمّع تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز driver وSUT bot المأخوذة من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار عقود الإيجار المجمّعة.
  - يتطلب روبوتين مختلفين في المجموعة الخاصة نفسها، مع كشف SUT bot عن اسم مستخدم Telegram.
  - لضمان ملاحظة مستقرة بين الروبوتات، فعّل وضع Bot-to-Bot Communication Mode في `@BotFather` لكلا الروبوتين وتأكد من أن driver bot يستطيع ملاحظة حركة مرور الروبوتات في المجموعة.
  - يكتب تقرير Telegram QA وملخصًا وقطعة أثر observed-messages تحت `.artifacts/qa-e2e/...`.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` جناح QA الاصطناعي الواسع وليس جزءًا من مصفوفة تغطية
النقل الحية.

| المسار | Canary | بوابة الإشارة | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | ملاحظة التفاعلات | أمر المساعدة |
| ------ | ------ | -------------- | ----------------- | ---------------------- | -------------------------- | -------------- | ------------ | ----------------- | ------------ |
| Matrix   | x      | x              | x                 | x                      | x                          | x              | x            | x                 |              |
| Telegram | x      |                |                   |                        |                            |                |              |                   | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على عقد إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل
Heartbeat لهذا العقد أثناء تشغيل المسار، ويحرّر العقد عند الإيقاف.

مرجع هيكل مشروع Convex:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - القيمة الافتراضية من البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (القيمة الافتراضية هي `maintainer`)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (القيمة الافتراضية `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (القيمة الافتراضية `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (القيمة الافتراضية `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (القيمة الافتراضية `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (القيمة الافتراضية `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` يسمح بعناوين Convex من نوع `http://` على loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/عرض المجموعة) المتغير
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على مخرجات قابلة للقراءة الآلية في السكربتات وأدوات CI.

عقد نقاط النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - حماية عقد إيجار نشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة تمثل معرّف دردشة Telegram رقمي.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولة غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين بالضبط:

1. محوّل نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أوامر QA جديدًا على المستوى الأعلى عندما يمكن للمضيف المشترك `qa-lab`
أن يمتلك هذا التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء الجناح وإنهاؤه
- توازي العمّال
- كتابة القطع الأثرية
- توليد التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Runner plugins عقد النقل:

- كيف يتم تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيف يُضبط Gateway لهذا النقل
- كيف يتم التحقق من الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تتم ملاحظة الرسائل الصادرة
- كيف تُعرَض النصوص وسجل حالة النقل الموحّد
- كيف تُنفذ الإجراءات المدعومة بالنقل
- كيف تتم معالجة إعادة الضبط أو التنظيف الخاصة بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ مشغّل النقل على وصلة المضيف المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل runner plugin أو حزام القناة.
4. تركيب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس.
   يجب أن تعلن Runner plugins عن `qaRunners` في `openclaw.plugin.json` وتصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. كتابة أو تكييف سيناريوهات Markdown تحت `qa/scenarios/`.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء أسماء التوافق البديلة الحالية تعمل ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في runner plugin أو حزام الـ plugin الخاص به.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن أن تستخدمها أكثر من قناة واحدة، فأضف مساعدًا عامًا بدل فرع خاص بالقناة في `suite.ts`.
- إذا كان السلوك ذا معنى فقط لنقل واحد، فأبقِ السيناريو خاصًا بهذا النقل وصرّح بذلك بوضوح في عقد السيناريو.

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

يجب أن تستخدم الأعمال الجديدة على القنوات أسماء المساعدات العامة.
توجد أسماء التوافق البديلة لتجنب ترحيل شامل في يوم واحد، وليس كنموذج
لتأليف السيناريوهات الجديدة.

## أجنحة الاختبار (ما الذي يعمل وأين)

فكّر في الأجنحة على أنها "تزداد واقعية" (وتزداد معها الهشاشة/الكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات شظايا متسلسلة (`vitest.full-*.config.ts`) عبر مشاريع Vitest المحددة الموجودة
- الملفات: قوائم جرد core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات node المسموح بها في `ui` والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعًا ومستقرًا
- ملاحظة المشاريع:
  - أصبح `pnpm test` غير المستهدف يشغّل الآن أحد عشر إعداد شظايا أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية root-project أصلية ضخمة واحدة. هذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع الأجنحة غير المرتبطة.
  - ما يزال `pnpm test --watch` يستخدم مخطط المشاريع الأصلي للجذر `vitest.config.ts`، لأن حلقة مراقبة متعددة الشظايا غير عملية.
  - تقوم `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` بتمرير أهداف الملفات/المجلدات الصريحة عبر مسارات محددة أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` تكلفة بدء تشغيل مشروع الجذر الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى هذه المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات source/test القابلة للتوجيه؛ أما تعديلات config/setup فتعيد الرجوع إلى إعادة تشغيل أوسع لمشروع الجذر.
  - تُمرَّر اختبارات unit الخفيفة من حيث الاستيراد من agents وcommands وplugins ومساعدات auto-reply و`plugin-sdk` والمناطق النفعية الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة من حيث الحالة/وقت التشغيل على المسارات الحالية.
  - تُطابِق بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` أيضًا تشغيلات وضع changed مع اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل الجناح الثقيل الكامل لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاثة أقسام مخصصة: مساعدات core ذات المستوى الأعلى، واختبارات التكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يُبقي أعمال حزام reply الأثقل بعيدًا عن اختبارات status/chunk/token الرخيصة.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف message-tool أو سياق وقت تشغيل Compaction،
    حافظ على مستويي التغطية معًا.
  - أضف اختبارات تراجعية مركزة للمساعدات عند حدود التوجيه/التطبيع الخالصة.
  - واحرص أيضًا على بقاء أجنحة تكامل المشغّل المضمّن سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه الأجنحة من أن المعرفات المحددة وسلوك Compaction ما زالا يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ واختبارات المساعدات وحدها ليست
    بديلًا كافيًا عن مسارات التكامل هذه.
- ملاحظة المجمع:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - يثبّت إعداد Vitest المشترك أيضًا `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وتهيئات e2e وlive.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - ترث كل شظية من شظايا `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف المشغّل المشترك `scripts/run-vitest.mjs` الآن أيضًا `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل تقلبات ترجمة V8 أثناء التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 القياسي.
- ملاحظة التكرار المحلي السريع:
  - يمرر `pnpm test:changed` عبر مسارات محددة عندما تُطابِق المسارات المتغيرة جناحًا أصغر بشكل واضح.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بالسلوك التوجيهي نفسه، ولكن مع حد أعلى أكبر للعمّال.
  - أصبح التوسع التلقائي المحلي للعمّال متحفظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تُحدث تشغيلات Vitest المتعددة المتزامنة ضررًا أقل افتراضيًا.
  - يضع إعداد Vitest الأساسي علامة على المشاريع/ملفات الإعداد باعتبارها `forceRerunTriggers` بحيث تبقى إعادة التشغيل في وضع changed صحيحة عندما تتغير أسلاك الاختبار.
  - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع cache صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى إخراج تفصيلي للاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه وبين مسار root-project الأصلي لذلك الفرق الملتزم، ويطبع الزمن المنقضي بالإضافة إلى macOS max RSS.
- يقوم `pnpm test:perf:changed:bench -- --worktree` بقياس الشجرة المتسخة الحالية عبر تمرير قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لوقت بدء تشغيل Vitest/Vite وتحويله.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لجناح unit مع تعطيل توازي الملفات.

### E2E (اختبار Gateway الدخاني)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts`
- القيم الافتراضية لوقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يتوافق مع بقية المستودع.
  - يستخدم عمّالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل تكلفة I/O الخاصة بوحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج وحدة التحكم المفصل.
- النطاق:
  - سلوك Gateway من طرف إلى طرف عبر عدة مثيلات
  - أسطح WebSocket/HTTP، واقتران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في المسار)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار OpenShell الخلفي الدخاني

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي وتنفيذ SSH
  - يتحقق من سلوك نظام الملفات القياسي البعيد عبر جسر sandbox fs
- التوقعات:
  - يعمل عند الاختيار فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر test gateway وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل جناح e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI binary أو wrapper script غير افتراضي

### Live (موفّرو خدمة حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا الموفّر/النموذج فعلًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق الموفّر، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI بطبيعته (شبكات حقيقية، وسياسات موفّر حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضَّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات unit من تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليلك المنزلي الحقيقي.
- أصبح `pnpm test:live` الآن يستخدم وضعًا أكثر هدوءًا افتراضيًا: فهو يُبقي إخراج التقدّم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع Gateway وضجيج Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا كنت تريد استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل موفّر): عيّن `*_API_KEYS` بصيغة فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا حيًا لكل حالة عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدّم/Heartbeat:
  - أصبحت الأجنحة الحية الآن تُصدر أسطر التقدّم إلى stderr بحيث تبقى استدعاءات الموفّر الطويلة ظاهرة النشاط حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدّم الموفّر/ Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الـ Gateway/المجسات باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي جناح يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت كثيرًا)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "الروبوت الخاص بي متعطل" / الإخفاقات الخاصة بالموفّر / استدعاء الأدوات: شغّل `pnpm test:live` بشكل مقيّد

## Live: مسح قدرات Android Node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلَن عنه حاليًا** بواسطة Android Node متصل والتحقق من سلوك عقد الأوامر.
- النطاق:
  - إعداد مسبق/يدوي (لا يقوم الجناح بتثبيت التطبيق أو تشغيله أو إقرانه).
  - التحقق من `node.invoke` في Gateway أمرًا بأمر لـ Android Node المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل مع Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع أن تنجح.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار النموذج الدخاني (مفاتيح الملف الشخصي)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- يوضح "النموذج المباشر" ما إذا كان الموفّر/النموذج يستطيع الرد أصلًا بالمفتاح المعطى.
- يوضح "اختبار Gateway الدخاني" ما إذا كان مسار Gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي تملك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فسيتخطاه للحفاظ على تركيز `pnpm test:live` على اختبار Gateway الدخاني
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (`Opus/Sonnet 4.6+` و`GPT-5.x + Codex` و`Gemini 3` و`GLM 4.7` و`MiniMax M2.7` و`Grok 4`)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار موفّري الخدمة:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل البيئة
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالموفّر معطلة / المفتاح غير صالح" و"مسار Gateway agent معطل"
  - يحتوي اختبارات تراجعية صغيرة ومعزولة (مثال: تدفق reasoning replay + tool-call في OpenAI Responses/Codex Responses)

### الطبقة 2: اختبار Gateway + dev agent الدخاني (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - تكرار النماذج التي لديها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - أن استدعاء أداة حقيقي يعمل (مجس `read`)
    - مجسات أدوات إضافية اختيارية (مجس `exec+read`)
    - استمرار عمل مسارات OpenAI التراجعية (استدعاء-أداة-فقط ← متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل أن يقرأه عبر `read` ثم يعيد nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce عبر `exec` داخل ملف مؤقت، ثم يقرأه مجددًا.
  - مجس الصورة: يرفق الاختبار صورة PNG مولّدة (قط + رمز عشوائي) ويتوقع من النموذج أن يعيد `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (`Opus/Sonnet 4.6+` و`GPT-5.x + Codex` و`Gemini 3` و`GLM 4.7` و`MiniMax M2.7` و`Grok 4`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح الحديثة/`all` الخاصة بـ Gateway افتراضيًا حدًا منسقًا عالي الإشارة؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار موفّري الخدمة (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - مجس `read` + مجس `exec+read` (ضغط على الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعمه لمدخلات الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار PNG صغيرة تحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسلها عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلّل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: الأخطاء البسيطة مسموح بها)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار الواجهة الخلفية CLI الدخاني (Claude أو Codex أو Gemini أو CLIات محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس إعدادك الافتراضي.
- القيم الافتراضية للاختبار الدخاني الخاصة بكل واجهة خلفية موجودة مع تعريف `cli-backend.ts` الخاص بالـ extension المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات تعريف Plugin الواجهة الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجّه).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الموجّه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل مجس الاستمرارية الافتراضي داخل الجلسة نفسها من Claude Sonnet إلى Opus (عيّنه إلى `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

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
- يشغّل اختبار CLI-backend الحي داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات تعريف اختبار CLI الدخاني من الـ extension المالكة، ثم يثبّت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزّنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا عمل `claude -p` مباشرة داخل Docker، ثم يشغّل دورين لـ Gateway CLI-backend من دون الاحتفاظ بمتغيرات البيئة الخاصة بمفتاح Anthropic API. يعطّل هذا المسار المعتمد على الاشتراك مجسات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافي بدل حدود خطة الاشتراك العادية.
- يختبر اختبار CLI-backend الحي الآن التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر Gateway CLI.
- يقوم الاختبار الدخاني الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: اختبار ACP bind الدخاني (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة ACP الحقيقي باستخدام ACP agent حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة synthetic message-channel في مكانها
  - إرسال متابعة عادية على نفس المحادثة
  - التحقق من وصول المتابعة إلى transcript جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - ACP agents في Docker: `claude,codex,gemini`
  - ACP agent لـ `pnpm test:live ...` المباشر: `claude`
  - القناة الاصطناعية: سياق محادثة بأسلوب Slack DM
  - الواجهة الخلفية ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول originating-route اصطناعية للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق message-channel من دون التظاهر بالتسليم الخارجي.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` معيّنًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` المضمّنة لوكيل ACP harness المحدد.

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
- يستورد `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبّت `acpx` في بادئة npm قابلة للكتابة، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يُبقي acpx متغيرات بيئة الموفّر من الملف الشخصي المستورَد متاحة لـ harness CLI الفرعي.

## Live: اختبار Codex app-server harness الدخاني

- الهدف: التحقق من Codex harness المملوكة للـ Plugin عبر الأسلوب الطبيعي
  `agent` في Gateway:
  - تحميل Plugin `codex` المضمّنة
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور Gateway agent إلى `codex/gpt-5.4`
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة app-server
    يمكنها الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- مجس صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مجس MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط الاختبار الدخاني `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  Codex harness المعطوب من النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من الصدفة/الملف الشخصي، بالإضافة إلى
  `~/.codex/auth.json` و`~/.codex/config.toml` المنسوخين اختياريًا

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
- يستورد `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مركّبة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي الخاص بـ Codex-harness.
- يفعّل Docker مجسات الصورة وMCP/tool افتراضيًا. عيّن
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي بحيث لا يتمكن الرجوع إلى `openai-codex/*` أو PI من إخفاء
  تراجع في Codex harness.

### الوصفات الحية الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للهشاشة:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار Gateway دخاني:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة موفّري خدمة:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصوصيات مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / الملف الشخصي)؛ وهذا هو ما يقصده معظم المستخدمين عندما يقولون "Gemini".
  - CLI: ينفّذ OpenClaw أمر `gemini` binary محلي؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (البث، ودعم الأدوات، واختلافات الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (الاختبارات الحية تعمل عند الاختيار فقط)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة الاختبار الدخاني الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يستمر في العمل:

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

اختر واحدًا على الأقل من كل عائلة موفّري خدمة:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يدعم "الأدوات" ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude أو Gemini أو متغيرات OpenAI القادرة على الرؤية، إلخ) لتجربة مجس الصورة.

### المجمّعات / Gateways البديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات + الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من موفّري الخدمة الذين يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات الاعتماد/الإعداد):

- المضمّنون: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (مثل LM Studio أو vLLM أو LiteLLM، إلخ)

نصيحة: لا تحاول ترميز "كل النماذج" ترميزًا ثابتًا في المستندات. القائمة المرجعية هي كل ما ترجعه `discoverModels(...)` على جهازك + كل المفاتيح المتاحة.

## بيانات الاعتماد (لا تقم بعمل commit لها مطلقًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي تعمل بها CLI. الآثار العملية:

- إذا كانت CLI تعمل، فيجب أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة الشخصية لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ "مفاتيح الملف الشخصي" في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تنسخ التشغيلات المحلية الحية الإعداد النشط وملفات `auth-profiles.json` الخاصة بكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` و`agentDir` حتى تبقى المجسات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح البيئة (مثلًا المُصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

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
  - يختبر مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم يكن `models.providers.comfy.<capability>` مضبوطًا
  - مفيد بعد تغيير إرسال workflow في comfy أو polling أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- الحزام: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Provider Plugin مسجّل لتوليد الصور
  - يحمّل متغيرات بيئة الموفّر الناقصة من صدفة تسجيل الدخول (`~/.profile`) قبل تنفيذ المجسات
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة الشخصية المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى موفّري الخدمة الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- موفّرو الخدمة المضمّنون المغطّون حاليًا:
  - `openai`
  - `google`
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات البيئة فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار موفّر توليد الموسيقى المشترك المضمّن
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة الموفّر من صدفة تسجيل الدخول (`~/.profile`) قبل تنفيذ المجسات
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة الشخصية المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى موفّري الخدمة الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل كلا وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يعتمد على الموجّه فقط
    - `edit` عندما يعلن الموفّر أن `capabilities.edit.enabled` مفعّل
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate`، ‏`edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس ضمن هذا المسح المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات البيئة فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار موفّر توليد الفيديو المشترك المضمّن
  - يستخدم افتراضيًا مسار الاختبار الدخاني الآمن للإصدار: موفّرو خدمة غير FAL، وطلب text-to-video واحد لكل موفّر، وموجّه lobster مدته ثانية واحدة، وحد عملية لكل موفّر مأخوذ من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن الانتظار في طوابير الموفّر قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات بيئة الموفّر من صدفة تسجيل الدخول (`~/.profile`) قبل تنفيذ المجسات
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات المصادقة الشخصية المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى موفّري الخدمة الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن الموفّر أن `capabilities.imageToVideo.enabled` مفعّل ويقبل الموفّر/النموذج المحدد إدخال صورة محليًا مدعومًا بمخزن مؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن الموفّر أن `capabilities.videoToVideo.enabled` مفعّل ويقبل الموفّر/النموذج المحدد إدخال فيديو محليًا مدعومًا بمخزن مؤقت في المسح المشترك
  - موفّرو `imageToVideo` المعلَن عنهم لكن المتخطَّون حاليًا في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - التغطية الخاصة بموفّر Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تجهيز عنوان URL لصورة بعيدة افتراضيًا
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - موفّرو `videoToVideo` المعلَن عنهم لكن المتخطَّون حاليًا في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لتلوين/إعادة مزج الفيديو
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل موفّر خدمة في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد العملية لكل موفّر من أجل تشغيل دخاني أكثر شدة
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل تجاوزات البيئة فقط

## حزام media live

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل أجنحة image وmusic وvideo الحية المشتركة عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات بيئة الموفّر الناقصة من `~/.profile`
  - يضيّق تلقائيًا كل جناح إلى موفّري الخدمة الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، حتى يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (اختياري: تحقق "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: `test:docker:live-models` و`test:docker:live-gateway` يشغّلان فقط ملف الاختبار الحي المطابق ذي مفاتيح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل الخاصة بك (واستيراد `~/.profile` إذا كان مركّبًا). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حدًا أصغر للاختبار الدخاني حتى يبقى المسح الكامل في Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما
  تريد صراحة المسح الأكبر والأشمل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغّلات الاختبار الدخاني للحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` تُقلع حاوية أو أكثر حقيقية وتتحقق من مسارات تكامل أعلى مستوى.

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب أدلة مصادقة CLI المنزلية المطلوبة فقط (أو كلها عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى تتمكن مصادقة OAuth الخاصة بـ CLI الخارجي من تحديث الرموز دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار ACP bind الدخاني: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار CLI backend الدخاني: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار Codex app-server harness الدخاني: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار Open WebUI الحي الدخاني: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج Onboarding (TTY، مع البنية الكاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (Gateway مُجهّز مسبقًا + جسر stdio + اختبار دخاني خام لإطارات إشعارات Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (اختبار التثبيت الدخاني + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب نسخة العمل الحالية بوضع القراءة فقط
وتجهيزها في دليل عمل مؤقت داخل الحاوية. هذا يُبقي صورة وقت التشغيل
نحيفة مع الاستمرار في تشغيل Vitest مقابل المصدر/الإعداد المحليين لديك تمامًا.
تتخطى خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة فقط وبنى التطبيق الناتجة مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ودلائل
`.build` أو Gradle المحلية للتطبيق، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
قطع أثرية خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ مجسات Gateway الحية
عمّال قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
`test:docker:openwebui` هو اختبار توافق أعلى مستوى: إذ يبدأ
حاوية OpenClaw Gateway مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرّض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البدء البارد الخاص به.
يتطلب هذا المسار مفتاح نموذج حي صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(الافتراضي: `~/.profile`) الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
يكون `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية Gateway
مُجهّزة مسبقًا، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة حتى يثبت الاختبار الدخاني ما الذي يصدره
الجسر فعليًا، وليس فقط ما الذي يعرضه SDK لعميل معين بالمصادفة.

اختبار ACP اليدوي بلغة طبيعية للسلاسل (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالاختبارات التراجعية/تصحيح الأخطاء. قد نحتاج إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذلك لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات البيئة فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام دلائل إعداد/مساحة عمل مؤقتة ومن دون أي عمليات تركيب لمصادقة CLI الخارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تشغّل الموفّرات المضيقة فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية موفّري الخدمة داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة مسبقًا لعمليات إعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن الملفات الشخصية (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرّضه Gateway لاختبار Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجّه التحقق من nonce المستخدم في اختبار Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط Mintlify والروابط الداخلية عندما تحتاج أيضًا إلى فحوصات عناوين الصفحات: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال (آمن لـ CI)

هذه اختبارات تراجعية لخط أنابيب "حقيقي" من دون موفّري خدمة حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، مع Gateway + حلقة agent حقيقيين): `src/gateway/gateway.test.ts` (الحالة: `"runs a mock OpenAI tool call end-to-end via gateway agent loop"`)
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: `"runs wizard over ws and writes auth token config"`)

## تقييمات موثوقية agent (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية agent":

- استدعاء أدوات وهمي عبر Gateway + حلقة agent الحقيقيين (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من طرف إلى طرف تتحقق من ربط الجلسات وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا لـ Skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجّه، هل يختار agent المهارة الصحيحة (أو يتجنب غير المرتبطة)؟
- **الامتثال:** هل يقرأ agent ملف `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود تدفق العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّري خدمة وهميين للتحقق من استدعاءات الأدوات + ترتيبها وقراءات ملفات المهارات وربط الجلسات.
- جناح صغير من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، والبوابات، وحقن الموجّه).
- تقييمات حية اختيارية (مفعّلة بالبيئة وعند الاختيار) فقط بعد وجود الجناح الآمن لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. فهي تكرّر المرور على كل Plugins المكتشفة وتشغّل مجموعة من
التحققات المتعلقة بالشكل والسلوك. يتخطى مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالوصلات والاختبارات الدخانية؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح القنوات أو موفّري الخدمة المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود موفّري الخدمة فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف السلسلة
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة موفّر الخدمة

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugin

### عقود موفّر الخدمة

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API فهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل موفّر الخدمة
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغَّل

- بعد تغيير صادرات أو مسارات `plugin-sdk` الفرعية
- بعد إضافة أو تعديل قناة أو Provider Plugin
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة موفّر/نموذج اكتُشفت في الاختبارات الحية:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (موفّر وهمي/بديل، أو التقاط التحويل الدقيق لشكل الطلب)
- إذا كانت المشكلة حية فقط بطبيعتها (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب الموفّر → اختبار النماذج المباشرة
  - خطأ في مسار جلسة/سجل/أداة Gateway → اختبار Gateway حي دخاني أو اختبار Gateway وهمي وآمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف نموذجي واحد لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

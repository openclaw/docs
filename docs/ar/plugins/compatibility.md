---
read_when:
    - تتولى صيانة Plugin لـ OpenClaw
    - ترى تحذيرًا بشأن توافق Plugin
    - أنت تخطط لترحيل SDK الخاص بـ Plugin أو البيان
summary: عقود توافق Plugin وبيانات الإهمال الوصفية وتوقعات الترحيل
title: توافق Plugin
x-i18n:
    generated_at: "2026-06-27T18:04:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

يبقي OpenClaw عقود Plugin الأقدم موصولة عبر محولات توافق مسماة
قبل إزالتها. يحمي هذا Pluginات المضمنة والخارجية الحالية بينما تتطور
عقود SDK والبيان والإعداد والتكوين وتشغيل الوكيل.

## سجل التوافق

تُتتبَّع عقود توافق Plugin في سجل النواة عند
`src/plugins/compat/registry.ts`.

يحتوي كل سجل على:

- رمز توافق مستقر
- الحالة: `active` أو `deprecated` أو `removal-pending` أو `removed`
- المالك: SDK أو التكوين أو الإعداد أو القناة أو المزوّد أو تنفيذ Plugin أو تشغيل الوكيل،
  أو النواة
- تواريخ الإدخال والإيقاف عند الاقتضاء
- إرشادات الاستبدال
- الوثائق والتشخيصات والاختبارات التي تغطي السلوك القديم والجديد

السجل هو المصدر لتخطيط المشرفين وفحوصات مستقبلية لمفتش Plugin. إذا تغير سلوك
موجّه إلى Plugin، فأضف سجل التوافق أو حدّثه في التغيير نفسه الذي يضيف المحول.

تُتتبَّع توافقات إصلاح Doctor والترحيل بشكل منفصل في
`src/commands/doctor/shared/deprecation-compat.ts`. تغطي هذه السجلات أشكال
التكوين القديمة، وتخطيطات سجل التثبيت، وطبقات الإصلاح التي قد تحتاج إلى البقاء
متاحة بعد إزالة مسار توافق وقت التشغيل.

ينبغي أن تتحقق عمليات مسح الإصدار من السجلين كليهما. لا تحذف ترحيل Doctor
لمجرد أن سجل توافق وقت التشغيل أو التكوين المطابق انتهت صلاحيته؛ تحقق أولًا
من عدم وجود مسار ترقية مدعوم لا يزال يحتاج إلى الإصلاح. أعد أيضًا التحقق من
كل تعليق توضيحي للاستبدال أثناء تخطيط الإصدار، لأن ملكية Plugin وبصمة التكوين
يمكن أن تتغير مع خروج المزوّدين والقنوات من النواة.

## حزمة مفتش Plugin

ينبغي أن يعيش مفتش Plugin خارج مستودع OpenClaw الأساسي كحزمة/مستودع منفصل
مدعوم بعقود التوافق والبيان ذات الإصدارات.

ينبغي أن يكون CLI لليوم الأول:

```sh
openclaw-plugin-inspector ./my-plugin
```

ينبغي أن يُصدر:

- تحقق البيان/المخطط
- إصدار توافق العقد الذي يجري فحصه
- فحوصات بيانات تعريف التثبيت/المصدر
- فحوصات استيراد المسار البارد
- تحذيرات الإيقاف والتوافق

استخدم `--json` لإخراج مستقر قابل للقراءة آليًا في تعليقات CI. ينبغي أن تكشف
نواة OpenClaw العقود والتجهيزات التي يستطيع المفتش استهلاكها، لكن لا ينبغي أن
تنشر ملف المفتش التنفيذي من حزمة `openclaw` الرئيسية.

### مسار قبول المشرف

استخدم Blacksmith Testbox المدعوم من Crabbox لمسار قبول الحزمة القابلة للتثبيت
عند التحقق من المفتش الخارجي مقابل حزم Plugin الخاصة بـ OpenClaw. شغّله من
نسخة OpenClaw نظيفة بعد بناء الحزمة:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

أبقِ هذا المسار اختياريًا للمشرفين لأنه يثبّت حزمة npm خارجية وقد يفحص حزم
Plugin مستنسخة خارج المستودع. تغطي حراسات المستودع المحلي خريطة تصدير SDK،
وبيانات تعريف سجل التوافق، وخفض استيرادات SDK المهملة، وحدود استيراد الامتدادات
المضمنة؛ أما إثبات مفتش Testbox فيغطي الحزمة كما يستهلكها مؤلفو Plugin الخارجيون.

## سياسة الإيقاف

ينبغي ألا يزيل OpenClaw عقد Plugin موثقًا في الإصدار نفسه الذي يقدّم بديله.

تسلسل الترحيل هو:

1. أضف العقد الجديد.
2. أبقِ السلوك القديم موصولًا عبر محول توافق مسمى.
3. أصدر تشخيصات أو تحذيرات عندما يستطيع مؤلفو Plugin التصرف.
4. وثّق الاستبدال والجدول الزمني.
5. اختبر المسارين القديم والجديد.
6. انتظر خلال نافذة الترحيل المعلنة.
7. أزل فقط بموافقة صريحة لإصدار كاسر للتوافق.

يجب أن تتضمن السجلات المهملة تاريخ بدء التحذير، والاستبدال، ورابط الوثائق،
وتاريخ الإزالة النهائي بما لا يزيد على ثلاثة أشهر بعد بدء التحذير. لا تضف
مسار توافق مهملًا بنافذة إزالة مفتوحة ما لم يقرر المشرفون صراحة أنه توافق دائم
ويعلّموه `active` بدلًا من ذلك.

## مناطق التوافق الحالية

تتضمن سجلات التوافق الحالية:

- استيرادات SDK الواسعة القديمة مثل `openclaw/plugin-sdk/compat`
- أشكال Plugin القديمة المعتمدة على الخطافات فقط و`before_agent_start`
- أسماء خطاف التنظيف القديمة `api.on("deactivate", ...)` بينما تنتقل Pluginات إلى
  `gateway_stop`
- نقاط دخول Plugin القديمة `activate(api)` بينما تنتقل Pluginات إلى
  `register(api)`
- أسماء SDK المستعارة القديمة مثل `openclaw/extension-api`،
  و`openclaw/plugin-sdk/channel-runtime`، وبناة حالة
  `openclaw/plugin-sdk/command-auth`، و`openclaw/plugin-sdk/test-utils` (المستبدلة
  بمسارات اختبار فرعية مركزة `openclaw/plugin-sdk/*`)، والاسمان المستعاران للنوع
  `ClawdbotConfig` / `OpenClawSchemaType`
- سلوك قائمة السماح وتمكين Pluginات المضمنة
- بيانات تعريف بيان متغيرات البيئة القديمة للمزوّد/القناة
- خطافات Plugin للمزوّد القديمة وأسماء الأنواع المستعارة بينما ينتقل المزوّدون إلى
  خطافات كتالوج ومصادقة وتفكير وإعادة تشغيل ونقل صريحة
- أسماء وقت التشغيل المستعارة القديمة مثل `api.runtime.taskFlow`،
  و`api.runtime.subagent.getSession`، و`api.runtime.stt`، و
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  المهملة
- حقول رد الاتصال المسطحة في WhatsApp `WebInboundMessage` مثل `body` و`chatId`،
  و`reply(...)`، و`mediaPath` بينما ينتقل مستهلكو رد الاتصال إلى سياقات
  `WebInboundCallbackMessage` المتداخلة `event` و`payload` و`quote` و`group` و
  `platform`
- حقول القبول العلوية في WhatsApp `WebInboundMessage` مثل `from` و
  `conversationId` و`accountId` و`accessControlPassed` و`chatType` بينما ينتقل
  مستهلكو رد الاتصال إلى غلاف `admission`
- التسجيل المقسّم القديم لـ memory-plugin بينما تنتقل Pluginات الذاكرة إلى
  `registerMemoryCapability`
- تسجيل مزوّد التضمين القديم الخاص بالذاكرة بينما ينتقل مزوّدو التضمين إلى
  `api.registerEmbeddingProvider(...)` و`contracts.embeddingProviders`
- مساعدو SDK للقنوات القديمة لمخططات الرسائل الأصلية، وبوابة الإشارات، وتنسيق
  غلاف الوارد، وتداخل قدرة الموافقة
- أسماء مفتاح مسار القناة ومساعد الهدف القابل للمقارنة المستعارة القديمة بينما
  تنتقل Pluginات إلى `openclaw/plugin-sdk/channel-route`
- تلميحات التفعيل التي يجري استبدالها بملكية مساهمة البيان
- احتياطي وقت تشغيل `setup-api` بينما تنتقل واصفات الإعداد إلى بيانات تعريف باردة
  `setup.requiresRuntime: false`
- خطافات `discovery` للمزوّد بينما تنتقل خطافات كتالوج المزوّد إلى
  `catalog.run(...)`
- بيانات تعريف القناة `showConfigured` / `showInSetup` بينما تنتقل حزم القنوات
  إلى `openclaw.channel.exposure`
- مفاتيح تكوين سياسة وقت التشغيل القديمة بينما يرحّل Doctor المشغلين إلى
  `agentRuntime`
- احتياطي بيانات تعريف تكوين القنوات المضمنة المولدة بينما تصل بيانات تعريف
  `channelConfigs` المعتمدة على السجل أولًا
- أعلام البيئة لتعطيل سجل Plugin المستمر وترحيل التثبيت بينما ترحّل مسارات الإصلاح
  المشغلين إلى `openclaw plugins registry --refresh` و`openclaw doctor --fix`
- مسارات تكوين بحث الويب وجلب الويب وx_search القديمة المملوكة لـ Plugin بينما
  يرحّلها Doctor إلى `plugins.entries.<plugin>.config`
- تكوين `plugins.installs` المؤلف وأسماء مسار تحميل Plugin المضمن المستعارة القديمة
  بينما تنتقل بيانات تعريف التثبيت إلى سجل Plugin المُدار بالحالة

ينبغي أن تفضّل شيفرة Plugin الجديدة الاستبدال المدرج في السجل وفي دليل الترحيل
المحدد. يمكن لـ Pluginات الحالية مواصلة استخدام مسار توافق حتى تعلن الوثائق
والتشخيصات وملاحظات الإصدار عن نافذة إزالة.

### أسماء WhatsApp المسطحة المستعارة لرد الاتصال الوارد

تسلّم ردود اتصال وقت تشغيل WhatsApp `WebInboundMessage`: السياقات المتداخلة
القانونية `event` و`payload` و`quote` و`group` و`platform`، إضافة إلى أسماء مسطحة
مهملة لحقول رد الاتصال التي شُحنت. ينبغي أن تقرأ شيفرة رد الاتصال الجديدة
السياقات المتداخلة. تستطيع الشيفرة التي تنشئ رسائل رد اتصال متداخلة نظيفة استخدام
`WebInboundCallbackMessage`؛ أما مستمعو التوافق الذين لا يزالون يحقنون رسائل
اختبار أو Plugin مسطحة قديمة فينبغي أن يستخدموا `LegacyFlatWebInboundMessage` أو
`WebInboundMessageInput`.

تبقى الأسماء المسطحة المستعارة متاحة حتى **2026-08-30**. تنطبق نافذة الإزالة تلك
على الوصول إلى الأسماء المسطحة فقط؛ شكل رد الاتصال المتداخل هو عقد وقت التشغيل
القانوني. تسمي تعليقات TypeScript التوضيحية `@deprecated` على كل اسم مسطح بديله
المتداخل الدقيق. أمثلة شائعة:

- تنتقل `id` و`timestamp` و`isBatched` إلى `event`.
- تنتقل `body` و`mediaPath` و`mediaType` و`mediaFileName` و`mediaUrl` و`location` و
  `untrustedStructuredContext` إلى `payload`.
- تنتقل `to` و`chatId` وحقول المرسل/الذات و`sendComposing` و`reply(...)` و
  `sendMedia(...)` إلى `platform`.
- تنتقل حقول `replyTo*` إلى `quote`، وتنتقل حقول موضوع المجموعة/المشارك/الإشارة
  إلى `group`.

يُستخرج `payload.untrustedStructuredContext` من حمولات المزوّد الواردة. ينبغي أن
تفحص Pluginات `label` و`source` و`type` قبل التعامل مع `payload` الخاصة به على
أنها موثوقة.

### حقول قبول WhatsApp الواردة

تحمل رسائل رد اتصال WhatsApp المقبولة الآن `admission`، وهو غلاف آمن للعامة
لقرار التحكم في الوصول الذي قبل الرسالة. ينبغي أن تقرأ شيفرة رد الاتصال الجديدة
حقائق القبول من `msg.admission` بدلًا من حقول القبول العلوية الأقدم.

تبقى الحقول العلوية متاحة حتى **2026-08-30**. تسمي تعليقات TypeScript التوضيحية
`@deprecated` كل بديل:

- ينتقل `from` و`conversationId` إلى `admission.conversation.id`.
- ينتقل `accountId` إلى `admission.accountId`.
- `accessControlPassed` هو عرض توافق مشتق من
  `admission.ingress.decision === "allow"`؛ في الرسائل التي تحمل `admission`
  بالفعل، لا تعيد كتابة القيمة المنطقية القديمة رسم مخطط الدخول.
- ينتقل `chatType` إلى `admission.conversation.kind`.

## ملاحظات الإصدار

ينبغي أن تتضمن ملاحظات الإصدار إيقافات Plugin القادمة مع تواريخ مستهدفة وروابط
إلى وثائق الترحيل. يجب أن يحدث ذلك التحذير قبل انتقال مسار توافق إلى
`removal-pending` أو `removed`.

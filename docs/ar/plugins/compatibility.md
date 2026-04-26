---
read_when:
    - أنت تُدير Plugin لـ OpenClaw
    - أنت ترى تحذير توافق Plugin
    - أنت تخطط لترحيل Plugin SDK أو manifest الخاصة بـ Plugin
summary: عقود توافق Plugins، وبيانات الإيقاف الوصفية، وتوقعات الترحيل
title: توافق Plugins
x-i18n:
    generated_at: "2026-04-26T11:35:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

يبقي OpenClaw عقود Plugin الأقدم موصولة عبر محوّلات توافق مسماة
قبل إزالتها. وهذا يحمي Plugins الحالية المضمّنة والخارجية
بينما تتطور عقود SDK وmanifest وsetup وconfig وبيئة تشغيل الوكيل.

## سجل التوافق

تُتتبَّع عقود توافق Plugins في السجل الأساسي ضمن
`src/plugins/compat/registry.ts`.

يحتوي كل سجل على:

- رمز توافق ثابت
- حالة: `active` أو `deprecated` أو `removal-pending` أو `removed`
- المالك: SDK أو config أو setup أو channel أو provider أو تنفيذ Plugin أو بيئة تشغيل الوكيل
  أو core
- تواريخ الإدخال والإيقاف عندما ينطبق ذلك
- إرشادات البديل
- وثائق وتشخيصات واختبارات تغطي السلوك القديم والجديد

يُعد السجل المصدر لتخطيط المحافظين وفحوصات Plugin inspector المستقبلية. وإذا تغيّر سلوك يواجه Plugin، فأضف أو حدّث سجل التوافق في التغيير نفسه الذي يضيف المحوّل.

يُتتبَّع توافق إصلاحات وترحيلات Doctor بشكل منفصل في
`src/commands/doctor/shared/deprecation-compat.ts`. تغطي هذه السجلات أشكال
config القديمة، وتخطيطات install-ledger، ووسائل repair shim التي قد تحتاج إلى البقاء
متاحة بعد إزالة مسار التوافق في وقت التشغيل.

يجب أن تتحقق عمليات المراجعة قبل الإصدار من كلا السجلين. لا تحذف ترحيل doctor
لمجرد انتهاء سجل التوافق المطابق في وقت التشغيل أو config؛ تحقّق أولًا
من عدم وجود مسار ترقية مدعوم ما يزال يحتاج إلى ذلك الإصلاح. كما يجب
إعادة التحقق من كل ملاحظة بديل أثناء تخطيط الإصدار لأن ملكية Plugins
وبصمة config قد تتغير مع انتقال providers وchannels خارج
core.

## حزمة Plugin inspector

يجب أن يعيش Plugin inspector خارج مستودع OpenClaw الأساسي كحزمة/مستودع
منفصل يستند إلى عقود التوافق وmanifest المُصدَّرة بالإصدارات.

يجب أن يكون CLI في اليوم الأول:

```sh
openclaw-plugin-inspector ./my-plugin
```

ويجب أن يُخرج:

- التحقق من manifest/schema
- إصدار عقد التوافق الجاري فحصه
- فحوصات بيانات التثبيت/المصدر الوصفية
- فحوصات الاستيراد للمسار البارد
- تحذيرات الإيقاف والتوافق

استخدم `--json` للحصول على مخرجات ثابتة قابلة للقراءة آليًا في شروح CI. يجب على
OpenClaw core أن يوفّر العقود وfixtures التي يستطيع inspector
استهلاكها، لكنه يجب ألا ينشر binary الخاص بـ inspector من حزمة `openclaw`
الرئيسية.

## سياسة الإيقاف

يجب ألا يزيل OpenClaw عقد Plugin موثّقًا في الإصدار نفسه
الذي يقدّم فيه بديله.

تسلسل الترحيل هو:

1. أضف العقد الجديد.
2. أبقِ السلوك القديم موصولًا عبر محوّل توافق مسمّى.
3. أصدر تشخيصات أو تحذيرات عندما يتمكن مؤلفو Plugins من اتخاذ إجراء.
4. وثّق البديل والجدول الزمني.
5. اختبر المسارين القديم والجديد.
6. انتظر طوال نافذة الترحيل المُعلنة.
7. لا تُزِل إلا بموافقة صريحة على إصدار كاسر.

يجب أن تتضمن السجلات المهجورة تاريخ بدء التحذير، والبديل، ورابط الوثائق،
وتاريخ الإزالة النهائي في مدة لا تتجاوز ثلاثة أشهر بعد بدء التحذير. لا
تضف مسار توافق مهجورًا بنافذة إزالة مفتوحة ما لم يقرر
المحافظون صراحةً أنه توافق دائم ويضعوه `active`
بدلًا من ذلك.

## مجالات التوافق الحالية

تتضمن سجلات التوافق الحالية ما يلي:

- واردات SDK الواسعة القديمة مثل `openclaw/plugin-sdk/compat`
- أشكال Plugins القديمة المعتمدة على hooks فقط و`before_agent_start`
- نقاط دخول Plugin القديمة من نوع `activate(api)` بينما تنتقل Plugins إلى
  `register(api)`
- الأسماء المستعارة القديمة لـ SDK مثل `openclaw/extension-api`,
  و`openclaw/plugin-sdk/channel-runtime`، وbuilders حالة
  `openclaw/plugin-sdk/command-auth`، و`openclaw/plugin-sdk/test-utils`، والأسماء المستعارة للأنواع `ClawdbotConfig` /
  `OpenClawSchemaType`
- سلوك allowlist وتمكين Plugin المضمّنة
- بيانات manifest الوصفية القديمة لمتغيرات env الخاصة بـ provider/channel
- hooks والإسماء المستعارة للأنواع القديمة الخاصة بـ provider plugins بينما تنتقل providers إلى
  catalog وauth وthinking وreplay وtransport hooks الصريحة
- الأسماء المستعارة القديمة لوقت التشغيل مثل `api.runtime.taskFlow`,
  و`api.runtime.subagent.getSession`، و`api.runtime.stt`
- التسجيل المنقسم القديم لـ memory-plugin بينما تنتقل memory plugins إلى
  `registerMemoryCapability`
- مساعدات SDK القديمة الخاصة بالقنوات لمخططات الرسائل الأصلية، وتقييد الإشارات،
  وتنسيق inbound envelope، وتعشيق إمكانات الموافقة
- activation hints التي يجري استبدالها بملكية المساهمات في manifest
- fallback وقت التشغيل `setup-api` بينما تنتقل setup descriptors إلى
  بيانات وصفية باردة من نوع `setup.requiresRuntime: false`
- hooks الخاصة بـ `discovery` في provider بينما تنتقل hooks الخاصة بفهرس provider إلى
  `catalog.run(...)`
- بيانات `showConfigured` / `showInSetup` الوصفية الخاصة بالقناة بينما تنتقل حزم القنوات
  إلى `openclaw.channel.exposure`
- مفاتيح config القديمة لسياسات بيئة التشغيل بينما يرحّل doctor المشغلين إلى
  `agentRuntime`
- fallback لبيانات config الوصفية المولّدة الخاصة بالقنوات المضمّنة بينما تهبط
  بيانات `channelConfigs` أولًا في السجل
- أعلام env القديمة لتعطيل سجل Plugins وترحيل التثبيت، بينما ترحّل
  تدفقات الإصلاح المشغلين إلى `openclaw plugins registry --refresh` و
  `openclaw doctor --fix`
- المسارات القديمة الخاصة بconfig للبحث على الويب، والجلب من الويب، و`x_search` المملوكة للـ Plugin بينما يرحّل doctor هذه المسارات إلى `plugins.entries.<plugin>.config`
- config القديمة المكتوبة في `plugins.installs` والأسماء المستعارة لمسارات تحميل Plugin المضمّنة بينما تنتقل بيانات التثبيت الوصفية إلى plugin ledger المُدار بالحالة

يجب أن يفضّل كود Plugins الجديد البديل المذكور في السجل وفي
دليل الترحيل المحدد. ويمكن للـ Plugins الحالية الاستمرار في استخدام مسار
توافق حتى تعلن الوثائق والتشخيصات وملاحظات الإصدار عن نافذة إزالة.

## ملاحظات الإصدار

يجب أن تتضمن ملاحظات الإصدار عمليات إيقاف Plugin القادمة مع التواريخ المستهدفة
وروابط وثائق الترحيل. ويجب أن يحدث هذا التحذير قبل أن ينتقل مسار
التوافق إلى `removal-pending` أو `removed`.

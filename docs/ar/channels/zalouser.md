---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول إلى Zalo Personal أو تدفّق الرسائل
summary: دعم حساب Zalo الشخصي عبر zca-js الأصلي (تسجيل الدخول برمز QR)، والإمكانات، والإعدادات
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-07-12T05:40:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبي. تعمل هذه عملية التكامل على أتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي، داخل العملية، من دون ملف CLI ثنائي خارجي.

<Warning>
هذه عملية تكامل غير رسمية وقد تؤدي إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## التثبيت

Zalo Personal هو Plugin خارجي رسمي، وغير مضمّن في النواة. ثبّته قبل الاستخدام:

```bash
openclaw plugins install @openclaw/zalouser
```

- تثبيت إصدار محدد: `openclaw plugins install @openclaw/zalouser@<version>`
- من نسخة مستودع مصدرية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [الإضافات](/ar/tools/plugin)

## الإعداد السريع

1. ثبّت Plugin (أعلاه).
2. سجّل الدخول (عبر رمز QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR ضوئيًا باستخدام تطبيق Zalo على الهاتف المحمول.
3. فعّل القناة:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. أعد تشغيل Gateway (أو أكمل الإعداد).
5. يكون الوصول عبر الرسائل المباشرة مضبوطًا افتراضيًا على الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هي

- تعمل بالكامل داخل العملية عبر مكتبة `zca-js` (من دون ملف `zca`/`openzca` ثنائي خارجي).
- تستخدم مستمعات الأحداث الأصلية (`message` و`error`) لاستقبال الرسائل الواردة.
- ترسل الردود مباشرةً عبر واجهة JS البرمجية (نص/وسائط/رابط).
- مصممة لحالات استخدام «الحساب الشخصي» التي لا تتوفر فيها واجهة Zalo Bot API.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذه العملية تؤتمت **حساب مستخدم Zalo شخصيًا** (بشكل غير رسمي). الاسم `zalo` محجوز لعملية تكامل رسمية محتملة مستقبلًا مع واجهة Zalo API.

## العثور على المعرّفات (الدليل)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُقسَّم النص الصادر إلى مقاطع من 2000 محرف (حد عميل Zalo).
- البث غير مدعوم.

## التحكم في الوصول (الرسائل المباشرة)

`channels.zalouser.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يجب أن تستخدم `channels.zalouser.allowFrom` معرّفات مستخدمي Zalo الثابتة. ويمكنها أيضًا الإشارة إلى مجموعات وصول ثابتة للمرسلين (`accessGroup:<name>`). أثناء الإعداد التفاعلي، يمكن تحويل الأسماء المُدخلة إلى معرّفات باستخدام بحث جهات الاتصال داخل عملية Plugin.

إذا بقي اسم خام في الإعدادات، فلا يُحوَّل عند بدء التشغيل إلا عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`. ومن دون هذا الاشتراك الصريح، تعتمد عمليات التحقق من المرسل في وقت التشغيل على المعرّفات فقط، وتُتجاهل الأسماء الخام لأغراض التخويل.

وافق عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## الوصول إلى المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "allowlist"` (تتطلب المجموعات إدخالًا صريحًا في قائمة السماح).
- فتح جميع المجموعات: `channels.zalouser.groupPolicy = "open"`.
- حظر جميع المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- عند استخدام `groupPolicy = "allowlist"`:
  - يجب أن تكون مفاتيح `channels.zalouser.groups` معرّفات مجموعات ثابتة؛ ولا تُحوَّل الأسماء إلى معرّفات عند بدء التشغيل إلا عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
  - تتحكم `channels.zalouser.groupAllowFrom` في المرسلين الذين يمكنهم تشغيل البوت داخل المجموعات المسموح بها؛ ويمكن الإشارة إلى مجموعات وصول ثابتة للمرسلين باستخدام `accessGroup:<name>`.
- يمكن لمعالج الإعداد المطالبة بقوائم السماح للمجموعات.
- تعتمد مطابقة قائمة السماح للمجموعات افتراضيًا على المعرّفات فقط. وتُتجاهل الأسماء التي لم تُحوَّل لأغراض المصادقة، ما لم تكن `channels.zalouser.dangerouslyAllowNameMatching: true` مفعّلة.
- تمثّل `channels.zalouser.dangerouslyAllowNameMatching: true` وضع توافق للطوارئ يعيد تفعيل تحويل الأسماء القابلة للتغيير عند بدء التشغيل ومطابقة أسماء المجموعات في وقت التشغيل.
- لا ترجع `groupAllowFrom` إلى `allowFrom` احتياطيًا لرسائل المجموعات العادية: يؤدي تركها فارغة في مجموعة مدرجة في قائمة السماح إلى فتح تلك المجموعة لأي مرسل. تُستثنى أوامر التحكم المخوّلة (مثل `/new`)؛ إذ ترجع عمليات التحقق من مرسل الأوامر إلى `allowFrom` عند فراغ `groupAllowFrom`.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` هو اسم حقل قديم؛ تستخدم الإعدادات الحالية `enabled`. ينقل `openclaw doctor --fix` الحقل `allow` إلى `enabled` تلقائيًا.
</Note>

### اشتراط الإشارة في المجموعات

- تتحكم `channels.zalouser.groups.<group>.requireMention` في ما إذا كانت ردود المجموعة تتطلب إشارة.
- ترتيب التحويل: معرّف المجموعة -> الاسم البديل `group:<id>` -> اسم المجموعة/الاسم المختصر (لا تنطبق العناصر المرشحة المستندة إلى الاسم إلا عند ضبط `dangerouslyAllowNameMatching: true`) -> ‏`*` -> القيمة الافتراضية (`true`).
- ينطبق ذلك على المجموعات المدرجة في قائمة السماح وعلى وضع المجموعات المفتوحة.
- يُعد اقتباس رسالة من البوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المخوّلة (مثل `/new`) تجاوز اشتراط الإشارة.
- عندما تُتخطى رسالة مجموعة بسبب اشتراط الإشارة، يحفظها OpenClaw كسجل مجموعة معلّق ويدرجها مع رسالة المجموعة التالية التي تتم معالجتها.
- حد سجل المجموعة: `channels.zalouser.historyLimit`، ثم `messages.groupChat.historyLimit`، ثم قيمة احتياطية قدرها `50`.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## تعدد الحسابات

تُربط الحسابات بملفات تعريف `zalouser` في حالة OpenClaw. مثال:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## متغيرات البيئة

يمكن أيضًا تحديد ملف التعريف من متغيرات البيئة:

| المتغير             | الغرض                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | اسم ملف التعريف المستخدم عند عدم ضبط `profile` في إعدادات القناة أو الحساب.             |
| `ZCA_PROFILE`      | قيمة احتياطية قديمة، لا تُستخدم إلا عند عدم ضبط `ZALOUSER_PROFILE`.                     |

تحدد أسماء ملفات التعريف بيانات اعتماد تسجيل دخول Zalo المحفوظة في حالة OpenClaw. ترتيب الحل:

1. قيمة `profile` الصريحة في الإعدادات.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. معرّف الحساب للحسابات غير الافتراضية، أو `default` للحساب الافتراضي.

في إعدادات تعدد الحسابات، يُفضّل ضبط `profile` لكل حساب في الإعدادات كي لا يتسبب متغير بيئة واحد في مشاركة عدة حسابات لجلسة تسجيل الدخول نفسها.

## الكتابة والتفاعلات وإقرارات التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (بحسب أفضل جهد).
- إجراء التفاعل مع الرسالة `react` مدعوم لـ`zalouser` ضمن إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري تفاعلي محدد من رسالة.
  - دلالات التفاعلات: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات وصفية للحدث، يرسل OpenClaw إقراري التسليم والمشاهدة (بحسب أفضل جهد).

## استكشاف الأخطاء وإصلاحها

**لا يستمر تسجيل الدخول:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يُحوَّل اسم قائمة السماح/المجموعة:**

- استخدم معرّفات رقمية في `allowFrom`/`groupAllowFrom` ومعرّفات مجموعات ثابتة في `groups`. إذا كنت تحتاج عمدًا إلى أسماء الأصدقاء/المجموعات المطابقة تمامًا، ففعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.

**الترقية من إعداد خارجي قديم قائم على `zca`/CLI:**

- أزل أي افتراضات بشأن عملية `zca` خارجية؛ تعمل القناة الآن بالكامل داخل العملية عبر `zca-js`، من دون ملف CLI ثنائي خارجي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك محادثات المجموعات واشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية

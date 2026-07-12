---
read_when:
    - إعداد البث الهادئ في Matrix لخادم Synapse أو Tuwunel المستضاف ذاتيًا
    - يريد المستخدمون إشعارات عند اكتمال الكتل فقط، وليس عند كل تعديل للمعاينة
summary: قواعد إشعارات Matrix لكل مستلم لتعديلات المعاينة النهائية الصامتة
title: قواعد دفع Matrix للمعاينات الصامتة
x-i18n:
    generated_at: "2026-07-12T05:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

عندما تكون قيمة `channels.matrix.streaming` هي `"quiet"`، يبث OpenClaw الرد من خلال تعديل حدث معاينة واحد في موضعه. تُرسل المعاينات على هيئة أحداث `m.notice` لا تُطلق إشعارات، ويُعلَّم التعديل النهائي باستخدام `content["com.openclaw.finalized_preview"] = true`. لا تُصدر عملاء Matrix إشعارًا عند ذلك التعديل النهائي إلا إذا طابقت قاعدة دفع خاصة بالمستخدم تلك العلامة. هذه الصفحة مخصصة للمشغّلين الذين يستضيفون Matrix ذاتيًا ويريدون تثبيت هذه القاعدة لكل حساب مستلم.

ينهي `streaming: "progress"` مسوداته عبر المسار نفسه، لذا تُفعَّل القاعدة نفسها أيضًا عند التعديلات النهائية في وضع التقدّم.

إذا كنت تريد فقط سلوك إشعارات Matrix القياسي، فاستخدم `streaming: "partial"` أو اترك البث متوقفًا. راجع [إعداد قناة Matrix](/ar/channels/matrix#streaming-previews).

## المتطلبات الأساسية

- المستخدم المستلم = الشخص الذي ينبغي أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلم لاستدعاءات API أدناه
- طابِق `sender` في قاعدة الدفع مع MXID الكامل لمستخدم البوت
- يجب أن يحتوي حساب المستلم مسبقًا على دافعات عاملة؛ لا تعمل قواعد المعاينة الهادئة إلا عندما يكون تسليم إشعارات الدفع العادي في Matrix سليمًا

## الخطوات

<Steps>
  <Step title="تهيئة المعاينات الهادئة">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="الحصول على رمز وصول المستلم">
    أعد استخدام رمز جلسة عميل حالي متى أمكن. لإنشاء رمز جديد:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="التحقق من وجود الدافعات">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا لم تُرجع أي دافعات، فأصلح تسليم إشعارات الدفع العادي في Matrix لهذا الحساب قبل المتابعة.

  </Step>

  <Step title="تثبيت قاعدة دفع التجاوز">
    ثبّت قاعدة تطابق علامة المعاينة النهائية بالإضافة إلى MXID الخاص بالبوت بصفته المرسل:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    استبدل ما يلي قبل التشغيل:

    - `https://matrix.example.org`: عنوان URL الأساسي لخادمك المنزلي
    - `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المستلم
    - `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لكل بوت ولكل مستلم (النمط: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: معرّف MXID لبوت OpenClaw، وليس معرّف المستلم

  </Step>

  <Step title="التحقق">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

بعد ذلك، اختبر ردًا مبثوثًا. في الوضع الهادئ، تعرض الغرفة معاينة مسودة هادئة وتُصدر إشعارًا واحدًا عند انتهاء الكتلة أو دور المحادثة.

  </Step>
</Steps>

لإزالة القاعدة لاحقًا، أرسل طلب `DELETE` إلى عنوان URL نفسه للقاعدة باستخدام رمز المستلم.

## ملاحظات حول تعدد البوتات

تُفهرس قواعد الدفع حسب `ruleId`: يؤدي تكرار تنفيذ `PUT` باستخدام المعرّف نفسه إلى تحديث قاعدة واحدة. إذا كانت عدة بوتات OpenClaw ترسل إشعارات إلى المستلم نفسه، فأنشئ قاعدة لكل بوت مع مطابقة مميزة للمرسل.

تُدرج قواعد `override` الجديدة التي يحددها المستخدم قبل قواعد المنع الافتراضية للخادم، لذا لا حاجة إلى معامل ترتيب إضافي. لا تؤثر القاعدة إلا في تعديلات المعاينة النصية فقط التي يمكن إنهاؤها في موضعها؛ أما ردود الوسائط، وعمليات الرجوع الاحتياطي للمعاينات القديمة، والنصوص النهائية التي قد تفعّل إشارات Matrix، فتُسلَّم بدلًا من ذلك كرسائل عادية مُصدرة للإشعارات.

## ملاحظات حول الخادم المنزلي

<AccordionGroup>
  <Accordion title="Synapse">
    لا يلزم إجراء أي تغيير خاص في `homeserver.yaml`. إذا كانت إشعارات Matrix العادية تصل بالفعل إلى هذا المستخدم، فإن رمز المستلم واستدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.

    إذا كنت تشغّل Synapse خلف وكيل عكسي أو عمليات عاملة، فتأكد من وصول `/_matrix/client/.../pushrules/` إلى Synapse بصورة صحيحة. تتولى العملية الرئيسية أو `synapse.app.pusher` أو عمليات دفع الإشعارات المهيأة تسليم إشعارات الدفع — فتأكد من أنها تعمل بصورة سليمة.

    تستخدم القاعدة شرط قاعدة الدفع `event_property_is` ‏(MSC3758، الإصدار v1.10 من قاعدة الدفع)، الذي أُضيف إلى Synapse في عام 2023. تقبل إصدارات Synapse الأقدم استدعاء `PUT pushrules/...` لكنها لا تطابق الشرط مطلقًا دون إظهار خطأ — رقِّ Synapse إذا لم يصل إشعار عند تعديل معاينة نهائية.

  </Accordion>

  <Accordion title="Tuwunel">
    المسار نفسه المتبع مع Synapse؛ لا يلزم أي إعداد خاص بـ Tuwunel لعلامة المعاينة النهائية.

    إذا اختفت الإشعارات أثناء نشاط المستخدم على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في الإصدار 1.4.2 (سبتمبر 2025)، ويمكنه منع إشعارات الدفع إلى الأجهزة الأخرى عمدًا أثناء نشاط أحد الأجهزة.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [إعداد قناة Matrix](/ar/channels/matrix)
- [مفاهيم البث](/ar/concepts/streaming)

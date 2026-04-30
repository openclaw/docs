---
read_when:
    - إعداد البث الهادئ في Matrix لـ Synapse أو Tuwunel المستضافين ذاتيًا
    - يريد المستخدمون تلقي الإشعارات فقط عند اكتمال الكتل، وليس عند كل تعديل في المعاينة.
summary: قواعد إشعارات Matrix لكل مستلم لتعديلات المعاينة النهائية الصامتة
title: قواعد الإشعارات الفورية في Matrix للمعاينات الصامتة
x-i18n:
    generated_at: "2026-04-30T07:42:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

عندما تكون `channels.matrix.streaming` هي `"quiet"`، يعدّل OpenClaw حدث معاينة واحدًا في مكانه ويميّز التعديل النهائي بعلامة محتوى مخصصة. لا ترسل عملاء Matrix إشعارًا بشأن التعديل النهائي إلا إذا طابقت قاعدة دفع لكل مستخدم تلك العلامة. هذه الصفحة مخصصة للمشغلين الذين يستضيفون Matrix ذاتيًا ويريدون تثبيت تلك القاعدة لكل حساب مستلِم.

إذا كنت تريد سلوك إشعارات Matrix الافتراضي فقط، فاستخدم `streaming: "partial"` أو اترك البث متوقفًا. راجع [إعداد قناة Matrix](/ar/channels/matrix#streaming-previews).

## المتطلبات الأساسية

- المستخدم المستلِم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلِم لاستدعاءات API أدناه
- طابِق `sender` في قاعدة الدفع مع MXID الكامل لمستخدم البوت
- يجب أن يكون لدى حساب المستلِم دافعات تعمل بالفعل — لا تعمل قواعد المعاينة الهادئة إلا عندما يكون تسليم دفع Matrix العادي سليمًا

## الخطوات

<Steps>
  <Step title="تكوين المعاينات الهادئة">

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

  <Step title="الحصول على رمز وصول المستلِم">
    أعد استخدام رمز جلسة عميل موجود عندما يكون ذلك ممكنًا. لإنشاء رمز جديد:

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

إذا لم تعد أي دافعات، فأصلح تسليم دفع Matrix العادي لهذا الحساب قبل المتابعة.

  </Step>

  <Step title="تثبيت قاعدة الدفع التجاوزية">
    يميّز OpenClaw تعديلات معاينة النص فقط النهائية باستخدام `content["com.openclaw.finalized_preview"] = true`. ثبّت قاعدة تطابق تلك العلامة بالإضافة إلى MXID الخاص بالبوت كمرسل:

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

    استبدل قبل التشغيل:

    - `https://matrix.example.org`: عنوان URL الأساسي للخادم المنزلي لديك
    - `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المستلِم
    - `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لكل بوت ولكل مستلِم (النمط: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID بوت OpenClaw لديك، وليس MXID المستلِم

  </Step>

  <Step title="التحقق">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

بعد ذلك اختبر ردًا مبثوثًا. في الوضع الهادئ، تعرض الغرفة معاينة مسودة هادئة وترسل إشعارًا مرة واحدة عند انتهاء الكتلة أو الدور.

  </Step>
</Steps>

لإزالة القاعدة لاحقًا، نفّذ `DELETE` على عنوان URL نفسه للقاعدة باستخدام رمز المستلِم.

## ملاحظات تعدد البوتات

تُفهرس قواعد الدفع بواسطة `ruleId`: إعادة تشغيل `PUT` على المعرّف نفسه تحدّث قاعدة واحدة. لعدة بوتات OpenClaw ترسل إشعارات إلى المستلِم نفسه، أنشئ قاعدة واحدة لكل بوت مع مطابقة مرسل مميزة.

تُدرج قواعد `override` الجديدة المعرّفة من المستخدم قبل قواعد الكبت الافتراضية، لذلك لا حاجة إلى معامل ترتيب إضافي. تؤثر القاعدة فقط في تعديلات معاينة النص فقط التي يمكن إنهاؤها في مكانها؛ أما بدائل الوسائط وبدائل المعاينات القديمة فتستخدم تسليم Matrix العادي.

## ملاحظات الخادم المنزلي

<AccordionGroup>
  <Accordion title="Synapse">
    لا يلزم أي تغيير خاص في `homeserver.yaml`. إذا كانت إشعارات Matrix العادية تصل بالفعل إلى هذا المستخدم، فإن رمز المستلِم + استدعاء `pushrules` أعلاه هو خطوة الإعداد الرئيسية.

    إذا كنت تشغّل Synapse خلف وكيل عكسي أو عمال، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح. يتولى العملية الرئيسية أو `synapse.app.pusher` / عمال الدفع المكوّنون تسليم الدفع — تأكد من أنها سليمة.

    تستخدم القاعدة شرط قاعدة الدفع `event_property_is` ‏(MSC3758، قاعدة دفع v1.10)، الذي أُضيف إلى Synapse في 2023. تقبل إصدارات Synapse الأقدم استدعاء `PUT pushrules/...` لكنها لا تطابق الشرط بصمت مطلقًا — حدّث Synapse إذا لم يصل أي إشعار عند تعديل معاينة نهائي.

  </Accordion>

  <Accordion title="Tuwunel">
    التدفق نفسه كما في Synapse؛ لا يلزم أي تكوين خاص بـ Tuwunel لعلامة المعاينة النهائية.

    إذا اختفت الإشعارات أثناء نشاط المستخدم على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في 1.4.2 (سبتمبر 2025)، ويمكنه كبت عمليات الدفع عمدًا إلى الأجهزة الأخرى أثناء نشاط أحد الأجهزة.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [إعداد قناة Matrix](/ar/channels/matrix)
- [مفاهيم البث](/ar/concepts/streaming)

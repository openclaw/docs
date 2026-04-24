---
read_when:
    - إعداد البث الهادئ في Matrix لخوادم Synapse أو Tuwunel المستضافة ذاتيًا
    - يريد المستخدمون تلقي الإشعارات فقط عند اكتمال المقاطع، وليس عند كل تعديل للمعاينة
summary: قواعد push في Matrix لكل مستلم من أجل تعديلات معاينة نهائية هادئة
title: قواعد push في Matrix للمعاينات الهادئة
x-i18n:
    generated_at: "2026-04-24T07:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

عندما تكون قيمة `channels.matrix.streaming` هي `"quiet"`، يقوم OpenClaw بتعديل حدث معاينة واحد في مكانه ويضع علامة على التعديل النهائي بعلامة محتوى مخصصة. لا ترسل عملاء Matrix إشعارًا عند التعديل النهائي إلا إذا طابقت قاعدة push لكل مستخدم تلك العلامة. هذه الصفحة مخصصة للمشغلين الذين يستضيفون Matrix بأنفسهم ويريدون تثبيت تلك القاعدة لكل حساب مستلم.

إذا كنت تريد فقط سلوك إشعارات Matrix الافتراضي، فاستخدم `streaming: "partial"` أو اترك البث معطّلًا. راجع [إعداد قناة Matrix](/ar/channels/matrix#streaming-previews).

## المتطلبات المسبقة

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز الوصول الخاص بالمستخدم المستلم لاستدعاءات API أدناه
- طابق `sender` في قاعدة push مع MXID الكامل لمستخدم البوت
- يجب أن يكون لدى حساب المستلم pushers عاملة بالفعل — لا تعمل قواعد المعاينة الهادئة إلا عندما يكون تسليم push العادي في Matrix سليمًا

## الخطوات

<Steps>
  <Step title="إعداد المعاينات الهادئة">

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
    أعد استخدام رمز جلسة عميل موجود إن أمكن. لإنشاء رمز جديد:

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

  <Step title="التحقق من وجود pushers">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا لم يتم إرجاع أي pushers، فأصلح تسليم push العادي في Matrix لهذا الحساب قبل المتابعة.

  </Step>

  <Step title="تثبيت قاعدة push override">
    يضع OpenClaw علامة على تعديلات المعاينة النهائية النصية فقط بواسطة `content["com.openclaw.finalized_preview"] = true`. ثبّت قاعدة تطابق هذه العلامة بالإضافة إلى MXID البوت باعتباره المرسل:

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

    - `https://matrix.example.org`: عنوان URL الأساسي لخادمك المنزلي
    - `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المستلم
    - `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لكل بوت ولكل مستلم (النمط: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID بوت OpenClaw الخاص بك، وليس MXID المستلم

  </Step>

  <Step title="التحقق">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

بعد ذلك اختبر ردًا متدفقًا. في الوضع الهادئ، تعرض الغرفة معاينة مسودة هادئة وترسل إشعارًا مرة واحدة عند اكتمال المقطع أو الدور.

  </Step>
</Steps>

لإزالة القاعدة لاحقًا، استخدم `DELETE` على عنوان URL نفسه للقاعدة باستخدام رمز المستلم.

## ملاحظات حول تعدد البوتات

تُفهرس قواعد push بواسطة `ruleId`: تؤدي إعادة تشغيل `PUT` على المعرّف نفسه إلى تحديث قاعدة واحدة. عند وجود عدة بوتات OpenClaw ترسل إشعارات إلى المستلم نفسه، أنشئ قاعدة واحدة لكل بوت مع تطابق `sender` مميز.

تُدرج قواعد `override` الجديدة التي يحددها المستخدم قبل قواعد الكبت الافتراضية، لذلك لا تحتاج إلى أي معلمة ترتيب إضافية. تؤثر القاعدة فقط في تعديلات المعاينة النصية فقط التي يمكن إنهاؤها في مكانها؛ أما بدائل الوسائط وبدائل المعاينة القديمة فتستخدم تسليم Matrix العادي.

## ملاحظات حول الخادم المنزلي

<AccordionGroup>
  <Accordion title="Synapse">
    لا يلزم أي تغيير خاص في `homeserver.yaml`. إذا كانت إشعارات Matrix العادية تصل بالفعل إلى هذا المستخدم، فإن رمز المستلم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.

    إذا كنت تشغّل Synapse خلف reverse proxy أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح. تتم معالجة تسليم push بواسطة العملية الرئيسية أو `synapse.app.pusher` / عمال pusher المُعدّين — تأكد من أن هذه المكونات سليمة.

  </Accordion>

  <Accordion title="Tuwunel">
    التدفق نفسه كما في Synapse؛ لا حاجة إلى إعداد خاص بـ Tuwunel لعلامة المعاينة النهائية.

    إذا اختفت الإشعارات بينما كان المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في 1.4.2 (سبتمبر 2025)، ويمكنه كبت إشعارات push عمدًا إلى الأجهزة الأخرى أثناء نشاط أحد الأجهزة.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [إعداد قناة Matrix](/ar/channels/matrix)
- [مفاهيم البث](/ar/concepts/streaming)

---
read_when:
    - إعداد البث الهادئ في Matrix لخادم Synapse أو Tuwunel المستضاف ذاتيًا
    - يريد المستخدمون إشعارات عند اكتمال الكتل فقط، وليس عند كل تعديل للمعاينة
summary: قواعد إشعارات Matrix لكل مستلم لتعديلات المعاينة النهائية الصامتة
title: قواعد الدفع في Matrix للمعاينات الهادئة
x-i18n:
    generated_at: "2026-07-16T13:43:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

عندما تكون `channels.matrix.streaming.mode` هي `"quiet"`، يبث OpenClaw الرد عبر تعديل حدث معاينة واحد في موضعه. تُرسل المعاينات كأحداث `m.notice` غير مُطلِقة للإشعارات، ويُوسم التعديل النهائي بـ `content["com.openclaw.finalized_preview"] = true`. لا تُرسل عملاء Matrix إشعارًا عند ذلك التعديل النهائي إلا إذا طابقت قاعدة دفع خاصة بالمستخدم هذه العلامة. هذه الصفحة مخصصة للمشغّلين الذين يستضيفون Matrix ذاتيًا ويريدون تثبيت تلك القاعدة لكل حساب مستلم.

يُنهي `streaming.mode: "progress"` مسوداته عبر المسار نفسه، لذا تُفعَّل القاعدة نفسها أيضًا للتعديلات النهائية في وضع التقدم.

إذا كنت تريد فقط سلوك إشعارات Matrix الافتراضي، فاستخدم `streaming.mode: "partial"` أو اترك البث معطّلًا. راجع [إعداد قناة Matrix](/ar/channels/matrix#streaming-previews).

## المتطلبات الأساسية

- المستخدم المستلم = الشخص الذي ينبغي أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلم لاستدعاءات API أدناه
- طابق `sender` في قاعدة الدفع مع MXID الكامل لمستخدم البوت
- يجب أن يحتوي حساب المستلم مسبقًا على دافعات عاملة؛ لا تعمل قواعد المعاينة الصامتة إلا عندما يكون تسليم دفع Matrix العادي سليمًا

## الخطوات

<Steps>
  <Step title="تهيئة المعاينات الصامتة">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="الحصول على رمز وصول المستلم">
    أعِد استخدام رمز جلسة عميل موجود حيثما أمكن. ولإنشاء رمز جديد:

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

إذا لم تُرجع أي دافعات، فأصلح تسليم دفع Matrix العادي لهذا الحساب قبل المتابعة.

  </Step>

  <Step title="تثبيت قاعدة الدفع المتجاوزة">
    ثبّت قاعدة تطابق علامة المعاينة النهائية وMXID البوت بصفته المرسل:

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
    - `@bot:example.org`: معرّف MXID لبوت OpenClaw، وليس للمستلم

  </Step>

  <Step title="التحقق">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ثم اختبر ردًا متدفقًا. في الوضع الصامت، تعرض الغرفة معاينة مسودة صامتة وترسل إشعارًا مرة واحدة عند انتهاء الكتلة أو الدور.

  </Step>
</Steps>

لإزالة القاعدة لاحقًا، استخدم `DELETE` على عنوان URL نفسه للقاعدة مع رمز المستلم.

## ملاحظات حول تعدد البوتات

تُفهرس قواعد الدفع حسب `ruleId`: تؤدي إعادة تشغيل `PUT` على المعرّف نفسه إلى تحديث قاعدة واحدة. إذا كانت عدة بوتات OpenClaw تُشعر المستلم نفسه، فأنشئ قاعدة واحدة لكل بوت مع مطابقة مرسل مميزة.

تُدرج قواعد `override` الجديدة التي يحددها المستخدم قبل قواعد المنع الافتراضية للخادم، لذا لا حاجة إلى معامل ترتيب إضافي. لا تؤثر القاعدة إلا في تعديلات معاينة النصوص فقط التي يمكن إنهاؤها في موضعها؛ أما ردود الوسائط، وعمليات الرجوع الاحتياطي للمعاينات القديمة، والنصوص النهائية التي من شأنها تفعيل إشارات Matrix، فتُسلَّم بدلًا من ذلك كرسائل عادية مُطلِقة للإشعارات.

## ملاحظات حول الخادم المنزلي

<AccordionGroup>
  <Accordion title="Synapse">
    لا يلزم أي تغيير خاص في `homeserver.yaml`. إذا كانت إشعارات Matrix العادية تصل بالفعل إلى هذا المستخدم، فإن رمز المستلم واستدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.

    إذا كنت تشغّل Synapse خلف وكيل عكسي أو عمال، فتأكد من وصول `/_matrix/client/.../pushrules/` إلى Synapse بصورة صحيحة. تتولى العملية الرئيسية أو `synapse.app.pusher` / عمال الدافعات المهيّؤون تسليم الدفع — فتأكد من سلامة عملهم.

    تستخدم القاعدة شرط قاعدة الدفع `event_property_is` ‏(MSC3758، قاعدة الدفع v1.10)، الذي أُضيف إلى Synapse في 2023. تقبل إصدارات Synapse الأقدم استدعاء `PUT pushrules/...` لكنها لا تطابق الشرط أبدًا بصمت — رقِّ Synapse إذا لم يصل إشعار عند تعديل معاينة نهائي.

  </Accordion>

  <Accordion title="Tuwunel">
    التدفق نفسه المستخدم مع Synapse؛ لا يلزم إعداد خاص بـ Tuwunel لعلامة المعاينة النهائية.

    إذا اختفت الإشعارات أثناء نشاط المستخدم على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في 1.4.2 (سبتمبر 2025)، ويمكنه تعمّد منع إشعارات الدفع إلى الأجهزة الأخرى أثناء نشاط أحد الأجهزة.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [إعداد قناة Matrix](/ar/channels/matrix)
- [مفاهيم البث](/ar/concepts/streaming)

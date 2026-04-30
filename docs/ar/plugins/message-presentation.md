---
read_when:
    - إضافة أو تعديل عرض بطاقة الرسالة أو الزر أو قائمة الاختيار
    - إنشاء Plugin قناة يدعم الرسائل الصادرة الغنية
    - تغيير عرض أداة الرسائل أو قدرات التسليم
    - استكشاف أخطاء تراجعات عرض البطاقات/الكتل/المكوّنات الخاصة بمزوّد معيّن وإصلاحها
summary: بطاقات الرسائل الدلالية، والأزرار، وقوائم الاختيار، والنص الاحتياطي، وتلميحات التسليم لـ Plugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-04-30T08:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

عرض الرسائل هو العقد المشترك في OpenClaw لواجهة الدردشة الصادرة الغنية.
يتيح للوكلاء، وأوامر CLI، وتدفقات الموافقة، وPlugins وصف مقصد الرسالة
مرة واحدة، بينما يعرض كل Plugin قناة أفضل شكل أصلي ممكن لديه.

استخدم العرض لواجهة رسائل قابلة للنقل:

- أقسام نصية
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم اختيار
- عنوان البطاقة ونبرتها

لا تضف حقولًا أصلية خاصة بالمزوّد مثل Discord `components`، أو Slack
`blocks`، أو Telegram `buttons`، أو Teams `card`، أو Feishu `card` إلى أداة
الرسائل المشتركة. هذه مخرجات عرض يملكها Plugin القناة.

## العقد

يستورد مؤلفو Plugin العقد العام من:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

الشكل:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

دلالات الأزرار:

- `value` هي قيمة إجراء تطبيق تُوجّه مرة أخرى عبر مسار التفاعل الحالي في القناة
  عندما تدعم القناة عناصر تحكم قابلة للنقر.
- `url` هو زر رابط. يمكن أن يوجد من دون `value`.
- `label` مطلوب ويُستخدم أيضًا في النص الاحتياطي.
- `style` إرشادي. ينبغي أن يربط العارضون الأنماط غير المدعومة بقيمة افتراضية
  آمنة، لا أن يفشلوا الإرسال.

دلالات الاختيار:

- `options[].value` هي قيمة التطبيق المحددة.
- `placeholder` إرشادي وقد تتجاهله القنوات التي لا تدعم الاختيار أصليًا.
- إذا كانت القناة لا تدعم الاختيارات، يسرد النص الاحتياطي التسميات.

## أمثلة المنتجين

بطاقة بسيطة:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

زر رابط بعنوان URL فقط:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

قائمة اختيار:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

إرسال عبر CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

تسليم مثبّت:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

تسليم مثبّت مع JSON صريح:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## عقد العارض

تعلن Plugins القنوات دعم العرض على محوّلها الصادر:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

حقول القدرات هي قيم منطقية بسيطة عن قصد. فهي تصف ما يستطيع العارض جعله
تفاعليًا، لا كل حد في المنصة الأصلية. يظل العارضون مالكين للحدود الخاصة
بالمنصة، مثل الحد الأقصى لعدد الأزرار، وعدد الكتل، وحجم البطاقة.

## تدفق العرض في النواة

عندما يتضمن `ReplyPayload` أو إجراء رسالة `presentation`، تقوم النواة بما يلي:

1. تطبّع حمولة العرض.
2. تحل محوّل القناة الصادر للقناة الهدف.
3. تقرأ `presentationCapabilities`.
4. تستدعي `renderPresentation` عندما يستطيع المحوّل عرض الحمولة.
5. تعود إلى نص محافظ عندما يكون المحوّل غائبًا أو غير قادر على العرض.
6. ترسل الحمولة الناتجة عبر مسار تسليم القناة المعتاد.
7. تطبق بيانات تعريف التسليم مثل `delivery.pin` بعد أول رسالة مُرسلة بنجاح.

تملك النواة سلوك الرجوع الاحتياطي حتى يتمكن المنتجون من البقاء محايدين تجاه
القنوات. وتملك Plugins القنوات العرض الأصلي ومعالجة التفاعلات.

## قواعد التدهور

يجب أن يكون العرض آمنًا للإرسال على القنوات المحدودة.

يتضمن النص الاحتياطي:

- `title` كسطر أول
- كتل `text` كفقرات عادية
- كتل `context` كأسطر سياق مضغوطة
- كتل `divider` كفاصل بصري
- تسميات الأزرار، بما في ذلك عناوين URL لأزرار الروابط
- تسميات خيارات الاختيار

ينبغي أن تتدهور عناصر التحكم الأصلية غير المدعومة بدلًا من إفشال عملية
الإرسال كلها. أمثلة:

- يرسل Telegram نصًا احتياطيًا عندما تكون الأزرار المضمنة معطلة.
- القناة التي لا تدعم الاختيار تسرد خيارات الاختيار كنص.
- يصبح زر URL فقط إما زر رابط أصليًا أو سطر URL احتياطيًا.
- إخفاقات التثبيت الاختيارية لا تفشل الرسالة المسلّمة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ إذا طُلب التثبيت باعتباره
مطلوبًا ولم تستطع القناة تثبيت الرسالة المرسلة، يبلّغ التسليم عن فشل.

## ربط المزوّد

العارضون المضمّنون الحاليون:

| القناة          | هدف العرض الأصلي                    | ملاحظات                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | المكونات وحاويات المكونات           | يحافظ على `channelData.discord.components` القديم لمنتجي الحمولات الأصلية الخاصة بالمزوّد الحاليين، لكن عمليات الإرسال المشتركة الجديدة ينبغي أن تستخدم `presentation`. |
| Slack           | Block Kit                           | يحافظ على `channelData.slack.blocks` القديم لمنتجي الحمولات الأصلية الخاصة بالمزوّد الحاليين، لكن عمليات الإرسال المشتركة الجديدة ينبغي أن تستخدم `presentation`.       |
| Telegram        | نص مع لوحات مفاتيح مضمنة           | تتطلب الأزرار/الاختيارات قدرة الأزرار المضمنة على السطح الهدف؛ وإلا يُستخدم النص الاحتياطي.                                         |
| Mattermost      | نص مع خصائص تفاعلية                | تتدهور الكتل الأخرى إلى نص.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | يُضمّن نص `message` العادي مع البطاقة عند توفيرهما معًا.                                                                            |
| Feishu          | بطاقات تفاعلية                     | يمكن أن يستخدم رأس البطاقة `title`؛ ويتجنب المتن تكرار ذلك العنوان.                                                                                  |
| القنوات العادية | نص احتياطي                          | تحصل القنوات التي لا تملك عارضًا على مخرجات قابلة للقراءة رغم ذلك.                                                                                            |

توافق الحمولات الأصلية الخاصة بالمزوّد تسهيل انتقالي لمنتجي الردود الحاليين.
وليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## العرض مقابل InteractiveReply

`InteractiveReply` هو المجموعة الفرعية الداخلية الأقدم التي تستخدمها مساعدات
الموافقة والتفاعل. وهو يدعم:

- النص
- الأزرار
- الاختيارات

`MessagePresentation` هو عقد الإرسال المشترك المعتمد. ويضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- أزرار URL فقط
- بيانات تعريف تسليم عامة عبر `ReplyPayload.delivery`

استخدم المساعدات من `openclaw/plugin-sdk/interactive-runtime` عند وصل الشفرة
الأقدم:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

ينبغي أن تقبل الشفرة الجديدة `MessagePresentation` أو تنتجه مباشرة.

## تثبيت التسليم

التثبيت سلوك تسليم، وليس عرضًا. استخدم `delivery.pin` بدلًا من الحقول الأصلية
الخاصة بالمزوّد مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبت أول رسالة تُسلّم بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- إخفاقات التثبيت الاختيارية تتدهور وتترك الرسالة المرسلة سليمة.
- إخفاقات التثبيت المطلوبة تفشل التسليم.
- تثبّت الرسائل المجزأة أول جزء مُسلّم، وليس الجزء الأخير.

ما زالت إجراءات الرسائل اليدوية `pin` و`unpin` و`pins` موجودة للرسائل الحالية
عندما يدعم المزوّد هذه العمليات.

## قائمة تحقق مؤلف Plugin

- أعلن `presentation` من `describeMessageTool(...)` عندما تستطيع القناة عرض
  العرض الدلالي أو تدهوره بأمان.
- أضف `presentationCapabilities` إلى محوّل وقت التشغيل الصادر.
- نفّذ `renderPresentation` في شفرة وقت التشغيل، لا في شفرة إعداد Plugin
  لمستوى التحكم.
- أبق مكتبات واجهة المستخدم الأصلية خارج مسارات الإعداد/الفهرس الساخنة.
- حافظ على حدود المنصة في العارض والاختبارات.
- أضف اختبارات رجوع احتياطي للأزرار غير المدعومة، والاختيارات، وأزرار URL،
  وتكرار العنوان/النص، وعمليات الإرسال المختلطة التي تجمع `message` مع `presentation`.
- أضف دعم تثبيت التسليم عبر `deliveryCapabilities.pin` و
  `pinDeliveredMessage` فقط عندما يستطيع المزوّد تثبيت معرّف الرسالة المرسلة.
- لا تعرض حقول بطاقات/كتل/مكونات/أزرار أصلية جديدة خاصة بالمزوّد عبر
  مخطط إجراء الرسائل المشتركة.

## مستندات ذات صلة

- [CLI الرسائل](/ar/cli/message)
- [نظرة عامة على SDK الـ Plugin](/ar/plugins/sdk-overview)
- [معمارية Plugin](/ar/plugins/architecture-internals#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)

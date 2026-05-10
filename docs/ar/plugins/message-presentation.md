---
read_when:
    - إضافة أو تعديل تصيير بطاقة رسالة أو زر أو قائمة اختيار
    - بناء Plugin قناة يدعم الرسائل الصادرة الغنية
    - تغيير عرض أداة الرسائل أو إمكانات التسليم
    - استكشاف تراجعات عرض البطاقات/الكتل/المكوّنات الخاصة بالمزوّد وإصلاحها
summary: بطاقات رسائل دلالية، وأزرار، وقوائم اختيار، ونص بديل، وتلميحات تسليم لـ Plugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-05-10T19:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

عرض الرسائل هو العقد المشترك في OpenClaw لواجهة مستخدم الدردشة الصادرة الغنية.
وهو يتيح للوكلاء، وأوامر CLI، وتدفقات الموافقة، وplugins وصف مقصد الرسالة
مرة واحدة، بينما يعرض كل channel plugin أفضل شكل أصلي يستطيع عرضه.

استخدم العرض لواجهة مستخدم رسائل محمولة:

- أقسام نصية
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم اختيار
- عنوان البطاقة ونبرتها

لا تُضِف حقولًا أصلية جديدة خاصة بالمزوّد مثل Discord `components` أو Slack
`blocks` أو Telegram `buttons` أو Teams `card` أو Feishu `card` إلى أداة
الرسائل المشتركة. هذه مخرجات عرض يملكها channel plugin.

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

- `value` هي قيمة إجراء للتطبيق تُوجَّه مرة أخرى عبر مسار التفاعل الحالي
  الخاص بالقناة عندما تدعم القناة عناصر تحكم قابلة للنقر.
- `url` هو زر رابط. يمكن أن يوجد من دون `value`.
- `label` مطلوب ويُستخدم أيضًا في الرجوع النصي.
- `style` إرشادي. ينبغي أن يربط العارضون الأنماط غير المدعومة بافتراضي
  آمن، لا أن يفشلوا الإرسال.

دلالات الاختيار:

- `options[].value` هي قيمة التطبيق المحددة.
- `placeholder` إرشادي وقد تتجاهله القنوات التي لا تدعم الاختيار الأصلي.
- إذا كانت القناة لا تدعم الاختيارات، يسرد نص الرجوع التسميات.

## أمثلة المنتج

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

زر رابط URL فقط:

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

إرسال CLI:

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

تسليم مثبّت باستخدام JSON صريح:

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

تصرّح channel plugins بدعم العرض على محوّلها الصادر:

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

حقول الإمكانات هي قيم منطقية بسيطة عمدًا. وهي تصف ما يمكن للعارض جعله
تفاعليًا، لا كل حد من حدود المنصة الأصلية. لا يزال العارضون يملكون الحدود
الخاصة بالمنصة مثل الحد الأقصى لعدد الأزرار، وعدد الكتل، وحجم البطاقة.

## تدفق العرض في النواة

عندما يتضمن `ReplyPayload` أو إجراء رسالة `presentation`، تقوم النواة بما يلي:

1. تطبّع حمولة العرض.
2. تحل محوّل الصادر الخاص بالقناة المستهدفة.
3. تقرأ `presentationCapabilities`.
4. تستدعي `renderPresentation` عندما يستطيع المحوّل عرض الحمولة.
5. ترجع إلى نص محافظ عندما يغيب المحوّل أو لا يستطيع العرض.
6. ترسل الحمولة الناتجة عبر مسار تسليم القناة العادي.
7. تطبق بيانات التسليم الوصفية مثل `delivery.pin` بعد أول رسالة مُرسلة بنجاح.

تملك النواة سلوك الرجوع حتى يتمكن المنتجون من البقاء غير معتمدين على القناة.
وتملك channel plugins العرض الأصلي ومعالجة التفاعل.

## قواعد التدهور

يجب أن يكون العرض آمنًا للإرسال على القنوات المحدودة.

يتضمن نص الرجوع:

- `title` كسطر أول
- كتل `text` كفقرات عادية
- كتل `context` كأسطر سياق مضغوطة
- كتل `divider` كفاصل مرئي
- تسميات الأزرار، بما في ذلك عناوين URL لأزرار الروابط
- تسميات خيارات الاختيار

ينبغي أن تتدهور عناصر التحكم الأصلية غير المدعومة بدلًا من إفشال الإرسال كله.
أمثلة:

- يرسل Telegram مع تعطيل الأزرار المضمنة رجوعًا نصيًا.
- القناة التي لا تدعم الاختيار تسرد خيارات الاختيار كنص.
- يصبح زر URL فقط إما زر رابط أصليًا أو سطر URL رجوعيًا.
- إخفاقات التثبيت الاختيارية لا تفشل الرسالة المسلّمة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ إذا طُلب التثبيت على أنه
مطلوب وكانت القناة لا تستطيع تثبيت الرسالة المرسلة، يبلّغ التسليم عن فشل.

## ربط المزوّدين

العارضون المضمّنون الحاليون:

| القناة          | هدف العرض الأصلي                    | ملاحظات                                                                                                                                                 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | المكونات وحاويات المكونات           | يحافظ على `channelData.discord.components` القديم لمنتجي الحمولات الأصلية الخاصة بالمزوّد الحاليين، لكن الإرسالات المشتركة الجديدة يجب أن تستخدم `presentation`. |
| Slack           | Block Kit                           | يحافظ على `channelData.slack.blocks` القديم لمنتجي الحمولات الأصلية الخاصة بالمزوّد الحاليين، لكن الإرسالات المشتركة الجديدة يجب أن تستخدم `presentation`.       |
| Telegram        | نص ولوحات مفاتيح مضمنة              | تتطلب الأزرار/الاختيارات إمكانية الأزرار المضمنة للسطح المستهدف؛ وإلا يُستخدم الرجوع النصي.                                                           |
| Mattermost      | نص مع خصائص تفاعلية                 | تتدهور الكتل الأخرى إلى نص.                                                                                                                            |
| Microsoft Teams | Adaptive Cards                      | يُضمَّن نص `message` العادي مع البطاقة عندما يُقدَّم كلاهما.                                                                                            |
| Feishu          | بطاقات تفاعلية                      | يمكن لرأس البطاقة استخدام `title`؛ ويتجنب المتن تكرار ذلك العنوان.                                                                                     |
| القنوات العادية | رجوع نصي                            | لا تزال القنوات التي لا تملك عارضًا تحصل على مخرجات قابلة للقراءة.                                                                                    |

توافق الحمولات الأصلية الخاصة بالمزوّد هو تسهيل انتقالي لمنتجي الردود
الحاليين. وهو ليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## Presentation مقابل InteractiveReply

`InteractiveReply` هو المجموعة الفرعية الداخلية الأقدم التي تستخدمها مساعدات
الموافقة والتفاعل. وهو يدعم:

- النص
- الأزرار
- الاختيارات

`MessagePresentation` هو عقد الإرسال المشترك المعياري. وهو يضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- أزرار URL فقط
- بيانات وصفية عامة للتسليم عبر `ReplyPayload.delivery`

استخدم المساعدات من `openclaw/plugin-sdk/interactive-runtime` عند ربط التعليمات
البرمجية الأقدم:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

ينبغي للتعليمات البرمجية الجديدة أن تقبل أو تنتج `MessagePresentation` مباشرة.

يحافظ `presentationToInteractiveReply(...)` على نص العرض المرئي من خلال ربط
العنوان، والنص، والسياق، والأزرار، والاختيارات بشكل `InteractiveReply` الأقدم.
ينبغي لعارضي المكونات الذين يرسمون بالفعل كتل العنوان، والنص، والسياق، والفاصل
أصليًا استخدام `presentationToInteractiveControlsReply(...)` بدلًا من ذلك، ثم
إلحاق عناصر تحكم الأزرار والاختيار فقط.

يعيد `renderMessagePresentationFallbackText(...)` سلسلة فارغة لكتل العرض التي لا
تملك رجوعًا نصيًا، مثل عرض يحتوي على فاصل فقط. يمكن لوسائل النقل التي تتطلب متن
إرسال غير فارغ تمرير `emptyFallback` لاختيار متن أدنى من دون تغيير عقد الرجوع
الافتراضي.

## تثبيت التسليم

التثبيت هو سلوك تسليم، لا عرض. استخدم `delivery.pin` بدلًا من الحقول الأصلية
الخاصة بالمزوّد مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبّت أول رسالة تُسلَّم بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- إخفاقات التثبيت الاختيارية تتدهور وتترك الرسالة المرسلة سليمة.
- إخفاقات التثبيت المطلوبة تفشل التسليم.
- الرسائل المجزأة تثبّت أول جزء مسلّم، لا الجزء الأخير.

لا تزال إجراءات رسائل `pin` و`unpin` و`pins` اليدوية موجودة للرسائل الحالية
حيث يدعم المزوّد تلك العمليات.

## قائمة تحقق مؤلف Plugin

- صرّح بـ `presentation` من `describeMessageTool(...)` عندما تستطيع القناة عرض
  العرض الدلالي أو تدهوره بأمان.
- أضف `presentationCapabilities` إلى محوّل الصادر في وقت التشغيل.
- نفّذ `renderPresentation` في تعليمات وقت التشغيل البرمجية، لا في تعليمات إعداد
  Plugin الخاصة بمستوى التحكم.
- أبقِ مكتبات واجهة المستخدم الأصلية خارج مسارات الإعداد/الفهرس الساخنة.
- حافظ على حدود المنصة في العارض والاختبارات.
- أضف اختبارات رجوع للأزرار غير المدعومة، والاختيارات، وأزرار URL، وتكرار
  العنوان/النص، وإرسالات `message` المختلطة مع `presentation`.
- أضف دعم تثبيت التسليم عبر `deliveryCapabilities.pin` و`pinDeliveredMessage`
  فقط عندما يستطيع المزوّد تثبيت معرّف الرسالة المرسلة.
- لا تكشف حقول بطاقات/كتل/مكونات/أزرار أصلية جديدة خاصة بالمزوّد عبر مخطط
  إجراء الرسالة المشترك.

## مستندات ذات صلة

- [CLI الرسائل](/ar/cli/message)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [معمارية Plugin](/ar/plugins/architecture-internals#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)

---
read_when:
    - إضافة أو تعديل عرض بطاقات الرسائل أو الأزرار أو عناصر الاختيار
    - بناء Plugin قناة تدعم الرسائل الصادرة الغنية
    - تغيير عرض أداة الرسائل أو قدرات التسليم
    - تصحيح انحدارات العرض الخاصة بالمزوّد لبطاقات/كتل/مكونات الرسائل
summary: بطاقات الرسائل الدلالية، والأزرار، وعناصر الاختيار، والنص الاحتياطي، وتلميحات التسليم الخاصة بـ Plugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-04-24T07:54:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

عرض الرسائل هو العقد المشترك في OpenClaw لواجهات الدردشة الصادرة الغنية.
وهو يتيح للوكلاء، وأوامر CLI، وتدفقات الموافقة، وplugins وصف نية الرسالة
مرة واحدة، بينما تقوم كل Plugin قناة بعرض أفضل شكل أصلي تستطيع دعمه.

استخدم العرض من أجل واجهة رسائل قابلة للنقل:

- أقسام النص
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم اختيار
- عنوان البطاقة ونبرتها

لا تضف حقولًا أصلية جديدة خاصة بالمزوّد مثل `components` في Discord، أو
`blocks` في Slack، أو `buttons` في Telegram، أو `card` في Teams، أو `card`
في Feishu إلى أداة الرسائل المشتركة. فهذه مخرجات renderer تملكها Plugin القناة.

## العقد

يستورد مؤلفو plugins العقد العام من:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

البنية:

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

- `value` هي قيمة إجراء تطبيق تُعاد عبر مسار التفاعل القائم في القناة
  عندما تدعم القناة عناصر تحكم قابلة للنقر.
- `url` هو زر رابط. ويمكن أن يوجد من دون `value`.
- `label` مطلوبة وتُستخدم أيضًا في النص الاحتياطي.
- `style` إرشادية. ويجب على renderers تحويل الأنماط غير المدعومة إلى قيمة
  افتراضية آمنة، لا أن تفشل في الإرسال.

دلالات الاختيار:

- `options[].value` هي قيمة التطبيق المختارة.
- `placeholder` إرشادية وقد تتجاهلها القنوات التي لا تدعم
  عناصر الاختيار أصلًا.
- إذا كانت القناة لا تدعم عناصر الاختيار، فإن النص الاحتياطي يسرد التسميات.

## أمثلة للجهة المنتجة

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

زر رابط فقط عبر URL:

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

تسليم مثبت:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

تسليم مثبت مع JSON صريح:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## عقد Renderer

تعلن Plugins القنوات دعم العرض على outbound adapter الخاص بها:

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

حقول الإمكانات هي عمدًا مجرد قيم منطقية بسيطة. وهي تصف ما الذي يستطيع
renderer جعله تفاعليًا، لا كل حدود المنصة الأصلية. ومع ذلك تظل renderers
تملك الحدود الخاصة بالمنصة مثل الحد الأقصى لعدد الأزرار، وعدد الكتل،
وحجم البطاقة.

## تدفق العرض الأساسي

عندما يتضمن `ReplyPayload` أو إجراء رسالة قيمة `presentation`، فإن النواة تقوم بما يلي:

1. تسوية حمولة العرض.
2. تحليل outbound adapter الخاصة بالقناة المستهدفة.
3. قراءة `presentationCapabilities`.
4. استدعاء `renderPresentation` عندما تتمكن adapter من عرض الحمولة.
5. الرجوع إلى نص محافظ عندما تكون adapter غائبة أو غير قادرة على العرض.
6. إرسال الحمولة الناتجة عبر مسار تسليم القناة العادي.
7. تطبيق بيانات التسليم الوصفية مثل `delivery.pin` بعد أول
   رسالة تم إرسالها بنجاح.

تملك النواة سلوك fallback حتى تبقى الجهات المنتجة غير مرتبطة بقناة بعينها. أما
Plugins القنوات فتملك العرض الأصلي والتعامل مع التفاعلات.

## قواعد التدهور

يجب أن يكون العرض آمنًا للإرسال على القنوات المحدودة.

يتضمن النص الاحتياطي:

- `title` في السطر الأول
- كتل `text` كفقرات عادية
- كتل `context` كأسطر سياق مضغوطة
- كتل `divider` كفاصل بصري
- تسميات الأزرار، بما في ذلك عناوين URL للأزرار الرابطة
- تسميات خيارات الاختيار

يجب أن تتدهور عناصر التحكم الأصلية غير المدعومة بدلًا من أن تفشل عملية الإرسال كلها.
أمثلة:

- Telegram مع تعطيل الأزرار المضمنة يرسل نصًا احتياطيًا.
- القناة التي لا تدعم عناصر الاختيار تسرد خيارات الاختيار كنص.
- يتحول الزر الرابط فقط عبر URL إلى زر رابط أصلي أو إلى سطر URL احتياطي.
- لا تؤدي إخفاقات pin الاختيارية إلى فشل الرسالة المسلّمة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ فإذا طُلب التثبيت
كمتطلب ولم تستطع القناة تثبيت الرسالة المرسلة، فإن التسليم يُبلغ عن فشل.

## ربط المزوّد

الـ renderers المضمّنة الحالية:

| القناة          | هدف العرض الأصلي                   | الملاحظات                                                                                                                                             |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components وcomponent containers   | يحافظ على `channelData.discord.components` القديم لصالح الجهات المنتجة الحالية للحمولات الأصلية الخاصة بالمزوّد، لكن يجب أن تستخدم الإرسالات المشتركة الجديدة `presentation`. |
| Slack           | Block Kit                          | يحافظ على `channelData.slack.blocks` القديم لصالح الجهات المنتجة الحالية للحمولات الأصلية الخاصة بالمزوّد، لكن يجب أن تستخدم الإرسالات المشتركة الجديدة `presentation`.       |
| Telegram        | نص بالإضافة إلى inline keyboards   | تتطلب الأزرار/عناصر الاختيار قدرة الأزرار المضمنة على السطح المستهدف؛ وإلا فسيتم استخدام النص الاحتياطي.                                         |
| Mattermost      | نص بالإضافة إلى props تفاعلية      | تتدهور الكتل الأخرى إلى نص.                                                                                                                          |
| Microsoft Teams | Adaptive Cards                     | يتم تضمين نص `message` العادي مع البطاقة عندما يُقدَّمان معًا.                                                                                      |
| Feishu          | بطاقات تفاعلية                     | يمكن لرأس البطاقة استخدام `title`؛ أما المتن فيتجنب تكرار ذلك العنوان.                                                                              |
| القنوات العادية | نص احتياطي                         | تحصل القنوات التي لا تحتوي على renderer على خرج قابل للقراءة مع ذلك.                                                                                |

إن توافق الحمولات الأصلية الخاصة بالمزوّد هو مجرد تسهيل انتقالي للجهات المنتجة الحالية
للردود. وليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## Presentation مقابل InteractiveReply

تمثل `InteractiveReply` المجموعة الفرعية الداخلية الأقدم المستخدمة من قِبل
الموافقات ومساعدات التفاعل. وهي تدعم:

- النص
- الأزرار
- عناصر الاختيار

أما `MessagePresentation` فهي العقدة المشتركة الرسمية للإرسال. وهي تضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- أزرار URL-only
- بيانات تسليم وصفية عامة عبر `ReplyPayload.delivery`

استخدم المساعدات من `openclaw/plugin-sdk/interactive-runtime` عند ربط
الشيفرة الأقدم:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

يجب أن تقبل الشيفرة الجديدة `MessagePresentation` مباشرة أو تنتجها مباشرة.

## Delivery Pin

التثبيت هو سلوك تسليم، وليس جزءًا من العرض. استخدم `delivery.pin` بدلًا من
الحقول الأصلية الخاصة بالمزوّد مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبت أول رسالة تم تسليمها بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- تتدهور إخفاقات pin الاختيارية وتترك الرسالة المرسلة سليمة.
- تؤدي إخفاقات pin المطلوبة إلى فشل التسليم.
- في الرسائل المقسمة إلى أجزاء، يتم تثبيت أول جزء تم تسليمه، وليس الجزء الأخير.

ما تزال إجراءات الرسائل اليدوية `pin` و`unpin` و`pins` موجودة من أجل
الرسائل الحالية عندما يدعم المزوّد تلك العمليات.

## قائمة تحقق مؤلف Plugin

- أعلن عن `presentation` من `describeMessageTool(...)` عندما تتمكن القناة من
  عرض presentation دلالية أو تدهورها بأمان.
- أضف `presentationCapabilities` إلى outbound adapter الخاصة بوقت التشغيل.
- نفّذ `renderPresentation` في شيفرة وقت التشغيل، لا في شيفرة
  إعداد Plugin على مستوى control-plane.
- أبقِ مكتبات واجهة المستخدم الأصلية خارج مسارات setup/catalog الساخنة.
- حافظ على حدود المنصة في renderer وفي الاختبارات.
- أضف اختبارات fallback للأزرار غير المدعومة، وعناصر الاختيار، وأزرار URL، وازدواجية title/text، والإرسالات المختلطة بين `message` و`presentation`.
- أضف دعم delivery pin عبر `deliveryCapabilities.pin` و
  `pinDeliveredMessage` فقط عندما يستطيع المزوّد تثبيت معرّف الرسالة المرسلة.
- لا تكشف حقولًا أصلية جديدة للبطاقات/الكتل/المكونات/الأزرار الخاصة بالمزوّد
  عبر مخطط إجراءات الرسائل المشتركة.

## مستندات ذات صلة

- [CLI الخاصة بالرسائل](/ar/cli/message)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [Plugin Architecture](/ar/plugins/architecture-internals#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)

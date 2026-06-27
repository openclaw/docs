---
read_when:
    - إضافة أو تعديل عرض بطاقة الرسالة أو الزر أو قائمة الاختيار
    - بناء Plugin قناة يدعم الرسائل الصادرة الغنية
    - تغيير عرض أداة الرسائل أو إمكانات التسليم
    - تصحيح تراجعات عرض البطاقات/الكتل/المكوّنات الخاصة بالموفّر
summary: بطاقات الرسائل الدلالية، والأزرار، وقوائم الاختيار، ونصوص الرجوع الاحتياطي، وتلميحات التسليم لPlugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-06-27T18:07:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

عرض الرسائل هو العقد المشترك في OpenClaw لواجهة دردشة صادرة غنية.
يتيح للوكلاء وأوامر CLI وتدفقات الموافقة وPlugins وصف نية الرسالة
مرة واحدة، بينما يعرض كل Plugin قناة أفضل شكل أصلي ممكن لديه.

استخدم العرض لواجهة رسائل قابلة للنقل:

- أقسام نصية
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم اختيار
- عنوان البطاقة ونبرتها

لا تضف حقولا أصلية جديدة خاصة بالمزود مثل Discord `components` أو Slack
`blocks` أو Telegram `buttons` أو Teams `card` أو Feishu `card` إلى أداة
الرسائل المشتركة. هذه مخرجات عارض يملكها Plugin القناة.

## العقد

يستورد مؤلفو Plugins العقد العام من:

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` يشغل أمر شرطة مائلة أصلي عبر مسار الأوامر في النواة.
  استخدمه لأزرار الأوامر والقوائم المضمنة.
- `action.type: "callback"` يحمل بيانات Plugin مبهمة عبر مسار التفاعل في القناة.
  يجب ألا تعيد Plugins القنوات تفسير بيانات الاستدعاء كأوامر شرطة مائلة.
- `value` هي قيمة الاستدعاء المبهمة القديمة. يجب أن تستخدم عناصر التحكم الجديدة `action`
  حتى تتمكن Plugins القنوات من ربط الأوامر والاستدعاءات دون التخمين من النص.
- `url` زر رابط. يمكن أن يوجد دون `value`.
- `webApp` يصف زر تطبيق ويب أصلي خاصا بالقناة. يعرض Telegram هذا
  كـ `web_app` ويدعمه فقط في الدردشات الخاصة. لا يزال `web_app`
  مقبولا في حمولات JSON المرنة للتوافق، لكن منتجي TypeScript
  يجب أن يستخدموا `webApp`.
- `label` مطلوب، ويستخدم أيضا في النص الاحتياطي.
- `style` إرشادي. يجب أن تربط العارضات الأنماط غير المدعومة بقيمة افتراضية آمنة،
  لا أن تفشل عملية الإرسال.
- `priority` اختياري. عندما تعلن قناة حدود الإجراءات ويجب إسقاط عناصر تحكم،
  تبقي النواة الأزرار الأعلى أولوية أولا وتحافظ على
  الترتيب الأصلي بين الأزرار ذات الأولوية المتساوية. عندما تتسع كل عناصر التحكم، يحافظ
  على ترتيب المؤلف.
- `disabled` اختياري. يجب أن تختار القنوات الدعم صراحة باستخدام `supportsDisabled`؛ وإلا
  تخفض النواة عنصر التحكم المعطل إلى نص احتياطي غير تفاعلي.
- `reusable` اختياري. القنوات التي تدعم الاستدعاءات الأصلية القابلة لإعادة الاستخدام قد
  تبقي الإجراء متاحا بعد تفاعل ناجح. استخدمه مع
  الإجراءات القابلة للتكرار أو عديمة الأثر الجانبي مثل التحديث أو الفحص أو مزيد من التفاصيل؛
  واتركه غير معين للموافقات العادية أحادية الاستخدام والإجراءات الهدامة.

دلالات الاختيار:

- `options[].action` له معنى الأمر/الاستدعاء نفسه الخاص بزر `action`.
- `options[].value` هي قيمة التطبيق المحددة القديمة.
- `placeholder` إرشادي وقد تتجاهله القنوات التي لا تدعم
  الاختيار الأصلي.
- إذا كانت قناة لا تدعم الاختيارات، يسرد النص الاحتياطي التسميات.

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

زر رابط يحتوي على URL فقط:

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

زر تطبيق Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

## عقد العارض

تعلن Plugins القنوات دعم العرض على مهايئها الصادر:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

تصف قيم الإمكانية المنطقية ما يمكن للعارض جعله تفاعليا. تصف
`limits` الاختيارية الغلاف العام الذي يمكن للنواة تكييفه قبل استدعاء
العارض:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

تطبق النواة الحدود العامة على عناصر التحكم الدلالية قبل العرض. لا تزال العارضات
تملك التحقق النهائي الخاص بالمزود والاقتطاع لعدد الكتل الأصلية
وحجم البطاقة وحدود URL وخصوصيات المزود التي لا يمكن التعبير عنها في
العقد العام. إذا أزالت الحدود كل عنصر تحكم من كتلة، تبقي النواة
التسميات كنص سياق غير تفاعلي حتى تظل الرسالة المسلمة تحتوي على
بديل مرئي.

## تدفق العرض في النواة

عندما تتضمن `ReplyPayload` أو إجراء رسالة `presentation`، تقوم النواة بما يلي:

1. تطبع حمولة العرض.
2. تحل مهايئ الصادر للقناة الهدف.
3. تقرأ `presentationCapabilities`.
4. تطبق حدود الإمكانية العامة مثل عدد الإجراءات وطول التسمية
   وعدد خيارات الاختيار عندما يعلنها المهايئ.
5. تستدعي `renderPresentation` عندما يستطيع المهايئ عرض الحمولة.
6. تعود إلى نص محافظ عندما يكون المهايئ غائبا أو لا يستطيع العرض.
7. ترسل الحمولة الناتجة عبر مسار تسليم القناة العادي.
8. تطبق بيانات التسليم الوصفية مثل `delivery.pin` بعد أول
   رسالة مرسلة بنجاح.

تملك النواة سلوك الرجوع الاحتياطي حتى يتمكن المنتجون من البقاء مستقلين عن القنوات. تملك
Plugins القنوات العرض الأصلي ومعالجة التفاعل.

## قواعد التخفيض

يجب أن يكون العرض آمنا للإرسال على القنوات المحدودة.

يتضمن النص الاحتياطي:

- `title` كسطر أول
- كتل `text` كفقرات عادية
- كتل `context` كأسطر سياق مدمجة
- كتل `divider` كفاصل بصري
- تسميات الأزرار، بما في ذلك عناوين URL لأزرار الروابط
- تسميات خيارات الاختيار

يجب أن تتدهور عناصر التحكم الأصلية غير المدعومة بدلا من إفشال الإرسال بأكمله.
أمثلة:

- Telegram مع تعطيل الأزرار المضمنة يرسل نصا احتياطيا.
- قناة دون دعم للاختيار تسرد خيارات الاختيار كنص.
- زر يحتوي على URL فقط يصبح إما زر رابط أصليا أو سطر URL احتياطيا.
- إخفاقات التثبيت الاختيارية لا تفشل الرسالة المسلمة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ إذا طلب التثبيت على أنه
مطلوب ولا تستطيع القناة تثبيت الرسالة المرسلة، يبلغ التسليم عن فشل.

## ربط المزود

العارضات المضمنة الحالية:

| القناة         | هدف العرض الأصلي                | ملاحظات                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | المكونات وحاويات المكونات | يحافظ على `channelData.discord.components` القديم لمنتجي الحمولات الأصلية الخاصة بالمزود الحاليين، لكن عمليات الإرسال المشتركة الجديدة يجب أن تستخدم `presentation`. |
| Slack           | Block Kit                           | يحافظ على `channelData.slack.blocks` القديم لمنتجي الحمولات الأصلية الخاصة بالمزود الحاليين، لكن عمليات الإرسال المشتركة الجديدة يجب أن تستخدم `presentation`.       |
| Telegram        | نص مع لوحات مفاتيح مضمنة          | تتطلب الأزرار/الاختيارات إمكانية الأزرار المضمنة لسطح الهدف؛ وإلا يستخدم النص الاحتياطي.                                         |
| Mattermost      | نص مع خصائص تفاعلية         | تتدهور الكتل الأخرى إلى نص.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | يدرج نص `message` العادي مع البطاقة عند توفيرهما معا.                                                                            |
| Feishu          | بطاقات تفاعلية                   | يمكن أن يستخدم رأس البطاقة `title`؛ ويتجنب الجسم تكرار ذلك العنوان.                                                                                  |
| القنوات النصية العادية  | نص احتياطي                       | القنوات التي لا تملك عارضا لا تزال تحصل على مخرج قابل للقراءة.                                                                                            |

توافق الحمولات الأصلية للمزوّد هو تسهيل انتقالي لمنتجي الردود
الحاليين. وليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## العرض مقابل InteractiveReply

`InteractiveReply` هي المجموعة الفرعية الداخلية الأقدم التي تستخدمها مساعدات
الموافقة والتفاعل. وهي تدعم:

- النص
- الأزرار
- قوائم التحديد

`MessagePresentation` هو عقد الإرسال المشترك المعتمد. ويضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- أزرار URL فقط
- بيانات تعريف تسليم عامة عبر `ReplyPayload.delivery`

استخدم المساعدات من `openclaw/plugin-sdk/interactive-runtime` عند وصل الكود
الأقدم:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

ينبغي للكود الجديد قبول `MessagePresentation` أو إنتاجه مباشرة. حمولات
`interactive` الحالية هي مجموعة فرعية مهملة من `presentation`؛ ويظل دعم وقت
التشغيل قائمًا للمنتجين الأقدم.

أنواع `InteractiveReply*` القديمة ومساعدات التحويل معلّمة بـ `@deprecated` في
SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, و
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

يظل `presentationToInteractiveReply(...)` و
`presentationToInteractiveControlsReply(...)` متاحين كجسور تصيير لتنفيذات
القنوات القديمة. ينبغي ألا يستدعيهما كود المنتج الجديد؛ أرسل `presentation`
واترك التكييف في النواة/القناة يتولى التصيير.

لمساعدات الموافقة بدائل تقدّم العرض أولًا أيضًا:

- استخدم `buildApprovalPresentationFromActionDescriptors(...)` بدلًا من
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- استخدم `buildApprovalPresentation(...)` بدلًا من
  `buildApprovalInteractiveReply(...)`
- استخدم `buildExecApprovalPresentation(...)` بدلًا من
  `buildExecApprovalInteractiveReply(...)`

يعيد `renderMessagePresentationFallbackText(...)` سلسلة فارغة لكتل العرض التي
لا تملك نصًا احتياطيًا، مثل عرض يحتوي على فاصل فقط. يمكن لوسائط النقل التي
تتطلب متن إرسال غير فارغ تمرير `emptyFallback` لاختيار متن أدنى من دون تغيير
عقد النص الاحتياطي الافتراضي.

## تثبيت التسليم

التثبيت سلوك تسليم، وليس عرضًا. استخدم `delivery.pin` بدلًا من الحقول الأصلية
للمزوّد مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبّت أول رسالة تم تسليمها بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- إخفاقات التثبيت الاختيارية تتدهور وتترك الرسالة المرسلة كما هي.
- إخفاقات التثبيت المطلوبة تفشل التسليم.
- الرسائل المجزأة تثبّت أول جزء تم تسليمه، وليس الجزء الأخير.

ما زالت إجراءات الرسائل اليدوية `pin` و`unpin` و`pins` موجودة للرسائل الحالية
حيث يدعم المزوّد تلك العمليات.

## قائمة تحقق لمؤلف Plugin

- صرّح بـ `presentation` من `describeMessageTool(...)` عندما تستطيع القناة
  تصيير العرض الدلالي أو تقليله بأمان.
- أضف `presentationCapabilities` إلى محوّل وقت التشغيل الصادر.
- نفّذ `renderPresentation` في كود وقت التشغيل، وليس في كود إعداد Plugin ضمن
  مستوى التحكم.
- أبقِ مكتبات واجهة المستخدم الأصلية خارج مسارات الإعداد/الفهرس الساخنة.
- صرّح بحدود الإمكانات العامة في `presentationCapabilities.limits` عندما تكون
  معروفة.
- حافظ على الحدود النهائية للمنصة في المصيّر والاختبارات.
- أضف اختبارات احتياطية للأزرار غير المدعومة، وقوائم التحديد، وأزرار URL،
  وتكرار العنوان/النص، وعمليات الإرسال المختلطة التي تتضمن `message` مع
  `presentation`.
- أضف دعم تثبيت التسليم عبر `deliveryCapabilities.pin` و
  `pinDeliveredMessage` فقط عندما يستطيع المزوّد تثبيت معرّف الرسالة المرسلة.
- لا تعرض حقول بطاقات/كتل/مكوّنات/أزرار أصلية جديدة خاصة بالمزوّد عبر مخطط
  إجراء الرسائل المشترك.

## مستندات ذات صلة

- [CLI الرسائل](/ar/cli/message)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [معمارية Plugin](/ar/plugins/architecture-internals#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)

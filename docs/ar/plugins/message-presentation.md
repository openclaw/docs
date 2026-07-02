---
read_when:
    - إضافة أو تعديل عرض بطاقة الرسالة أو الزر أو قائمة الاختيار
    - بناء Plugin قناة يدعم الرسائل الصادرة الغنية
    - تغيير طريقة عرض أداة الرسائل أو إمكانات التسليم
    - تصحيح انحدارات عرض البطاقات/الكتل/المكونات الخاصة بمزوّد الخدمة
summary: بطاقات الرسائل الدلالية، والأزرار، وقوائم الاختيار، ونص الاحتياط، وتلميحات التسليم لـ Plugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-07-02T22:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

عرض الرسائل هو العقد المشترك في OpenClaw لواجهة مستخدم الدردشة الصادرة الغنية.
يتيح للوكلاء، وأوامر CLI، وتدفقات الموافقة، وPlugins وصف قصد الرسالة
مرة واحدة، بينما يعرض كل Plugin قناة أفضل هيئة أصلية يستطيعها.

استخدم العرض لواجهة مستخدم الرسائل المحمولة:

- أقسام النص
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم اختيار
- عنوان البطاقة ونبرتها

لا تضف حقولًا أصلية جديدة خاصة بالموفّر مثل Discord `components`، أو Slack
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

- يشغّل `action.type: "command"` أمر شرطة مائلة أصليًا عبر مسار أوامر النواة.
  استخدم هذا لأزرار الأوامر والقوائم المضمنة.
- يحمل `action.type: "callback"` بيانات Plugin مبهمة عبر مسار تفاعل القناة.
  يجب ألا تعيد Plugins القنوات تفسير بيانات callback كأوامر شرطة مائلة.
- `value` هي قيمة callback مبهمة قديمة. ينبغي أن تستخدم عناصر التحكم الجديدة `action`
  حتى تتمكن Plugins القنوات من ربط الأوامر وcallbacks دون التخمين من النص.
- `url` هو زر رابط. يمكن أن يوجد دون `value`.
- يصف `webApp` زر تطبيق ويب أصليًا للقناة. يعرض Telegram هذا
  على أنه `web_app` ولا يدعمه إلا في الدردشات الخاصة. لا يزال `web_app`
  مقبولًا في حمولات JSON المرنة للتوافق، لكن ينبغي أن يستخدم منتجو TypeScript
  `webApp`.
- `label` مطلوب ويُستخدم أيضًا في احتياطي النص.
- `style` إرشادي. ينبغي أن تربط العارضات الأنماط غير المدعومة بقيمة افتراضية
  آمنة، لا أن تُفشل الإرسال.
- `priority` اختياري. عندما تعلن قناة حدود الإجراءات ويجب إسقاط عناصر تحكم،
  تحتفظ النواة بالأزرار الأعلى أولوية أولًا وتحافظ على الترتيب الأصلي بين
  الأزرار ذات الأولوية المتساوية. عندما تتسع كل عناصر التحكم، يُحفظ الترتيب
  المؤلّف.
- `disabled` اختياري. يجب أن تشترك القنوات صراحةً عبر `supportsDisabled`؛ وإلا
  تخفض النواة عنصر التحكم المعطل إلى نص احتياطي غير تفاعلي.
- `reusable` اختياري. قد تبقي القنوات التي تدعم callbacks أصلية قابلة لإعادة الاستخدام
  الإجراء متاحًا بعد تفاعل ناجح. استخدمه للإجراءات القابلة للتكرار أو idempotent
  مثل التحديث أو الفحص أو مزيد من التفاصيل؛ واتركه غير مضبوط للموافقات العادية
  ذات الاستخدام الواحد والإجراءات التدميرية.

دلالات الاختيار:

- يحمل `options[].action` معنى الأمر/callback نفسه مثل زر `action`.
- `options[].value` هي قيمة التطبيق المحددة القديمة.
- `placeholder` إرشادي وقد تتجاهله القنوات التي لا تدعم الاختيار الأصلي.
- إذا لم تدعم قناة الاختيارات، يسرد النص الاحتياطي التسميات.

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

زر تطبيق Telegram المصغر:

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

إرسال CLI:

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

تصف قيم الإمكانات المنطقية ما يمكن للعارض جعله تفاعليًا. تصف `limits` الاختيارية
الغلاف العام الذي يمكن للنواة تكييفه قبل استدعاء العارض:

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

تطبّق النواة الحدود العامة على عناصر التحكم الدلالية قبل العرض. لا يزال العارضون
يملكون التحقق والقص النهائيين الخاصين بالموفّر لعدد الكتل الأصلية، وحجم البطاقة،
وحدود URL، وخصوصيات الموفّر التي لا يمكن التعبير عنها في العقد العام. إذا أزالت
الحدود كل عنصر تحكم من كتلة ما، تبقي النواة التسميات كنص سياق غير تفاعلي حتى
تظل الرسالة المسلّمة تحتوي على احتياطي مرئي.

## تدفق عرض النواة

عندما يتضمن `ReplyPayload` أو إجراء رسالة `presentation`، تقوم النواة بما يلي:

1. تطبّع حمولة العرض.
2. تحل محوّل الخروج للقناة الهدف.
3. تقرأ `presentationCapabilities`.
4. تطبّق حدود الإمكانات العامة مثل عدد الإجراءات، وطول التسمية، وعدد خيارات
   الاختيار عندما يعلنها المحوّل.
5. تستدعي `renderPresentation` عندما يستطيع المحوّل عرض الحمولة.
6. تعود إلى نص محافظ عندما يكون المحوّل غائبًا أو لا يستطيع العرض.
7. ترسل الحمولة الناتجة عبر مسار تسليم القناة العادي.
8. تطبّق بيانات تعريف التسليم مثل `delivery.pin` بعد أول رسالة مُرسلة بنجاح.

تملك النواة سلوك الاحتياطي حتى يبقى المنتجون غير مرتبطين بقناة معينة. وتملك
Plugins القنوات العرض الأصلي ومعالجة التفاعل.

## قواعد التدهور

يجب أن يكون العرض آمنًا للإرسال على القنوات المحدودة.

يتضمن النص الاحتياطي:

- `title` كسطر أول
- كتل `text` كفقرات عادية
- كتل `context` كأسطر سياق مدمجة
- كتل `divider` كفاصل مرئي
- تسميات الأزرار، بما في ذلك URLs لأزرار الروابط
- تسميات خيارات الاختيار

### ظهور احتياطي قيمة الزر

عندما لا تستطيع قناة عرض عناصر التحكم التفاعلية، تعود قيم الأزرار والاختيارات
إلى نص عادي. يحافظ سلوك الاحتياطي على قابلية الاستخدام مع إبقاء بيانات callback
المبهمة خاصة:

- تعرض الإجراءات ذات النوع **`command`** بصيغة `label: \`command\`` حتى يستطيع المستخدمون
  نسخ الأمر وتشغيله يدويًا في إدخال القناة.
- تعرض الإجراءات ذات النوع **`callback`** وحقول **`value`** القديمة
  كتسمية فقط. لا تُكشف قيمة callback المبهمة في النص الاحتياطي.
- تعرض أزرار **`url` / `webApp`** نص URL بجانب تسمية الزر،
  لأن URL موجّه للمستخدم.
- تعرض **خيارات الاختيار** كتسمية فقط. لا تُكشف قيمة الخيار الأساسية
  في النص الاحتياطي.

يجب أن تشتق محوّلات القنوات التي تضيف إرشادات أوامر يدوية في واجهة الاحتياطي الخاصة بها (مثل
تعليمات تعليق مستند Feishu) فحص وجود الأمر من كتل العرض نفسها التي يستخدمها
عارض الاحتياطي، حتى لا يظهر نص الإرشادات إلا عندما يكون أمر يدوي معروضًا فعليًا.

ينبغي أن تتدهور عناصر التحكم الأصلية غير المدعومة بدلًا من إفشال الإرسال كله.
أمثلة:

- يرسل Telegram مع تعطيل الأزرار المضمنة احتياطيًا نصيًا.
- تسرد القناة التي لا تدعم الاختيار خيارات الاختيار كنص.
- يتحول زر URL فقط إما إلى زر رابط أصلي أو سطر URL احتياطي.
- لا تُفشل إخفاقات التثبيت الاختيارية الرسالة المسلّمة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ إذا طُلب التثبيت باعتباره
مطلوبًا ولم تستطع القناة تثبيت الرسالة المُرسلة، يبلّغ التسليم عن فشل.

## ربط الموفّر

العارضون المضمنون حاليًا:

| القناة          | هدف العرض الأصلي                  | ملاحظات                                                                                                                                           |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | المكوّنات وحاويات المكوّنات        | يحافظ على `channelData.discord.components` القديم لمنتجي الحمولات الأصلية للمزوّد الحاليين، لكن يجب أن تستخدم عمليات الإرسال المشتركة الجديدة `presentation`. |
| Slack           | Block Kit                           | يحافظ على `channelData.slack.blocks` القديم لمنتجي الحمولات الأصلية للمزوّد الحاليين، لكن يجب أن تستخدم عمليات الإرسال المشتركة الجديدة `presentation`.       |
| Telegram        | نص مع لوحات مفاتيح مضمنة           | تتطلب الأزرار/عناصر التحديد قدرة الأزرار المضمنة للسطح المستهدف؛ وإلا يُستخدم الرجوع إلى النص.                                                   |
| Mattermost      | نص مع خصائص تفاعلية                | تتحول الكتل الأخرى إلى نص.                                                                                                                        |
| Microsoft Teams | Adaptive Cards                      | يُضمّن نص `message` العادي مع البطاقة عندما يُقدَّمان معًا.                                                                                      |
| Feishu          | بطاقات تفاعلية                     | يمكن أن يستخدم رأس البطاقة `title`؛ ويتجنب المتن تكرار ذلك العنوان.                                                                              |
| القنوات النصية البسيطة | الرجوع إلى النص                    | تظل القنوات التي لا تحتوي على عارض تحصل على مخرج قابل للقراءة.                                                                                  |

توافق الحمولات الأصلية للمزوّد هو تسهيل انتقالي لمنتجي الردود الحاليين. وليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## Presentation مقابل InteractiveReply

`InteractiveReply` هو المجموعة الفرعية الداخلية الأقدم التي تستخدمها أدوات الموافقة والتفاعل المساعدة. ويدعم:

- النص
- الأزرار
- عناصر التحديد

`MessagePresentation` هو عقد الإرسال المشترك المعتمد. ويضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- أزرار URL فقط
- بيانات تعريف تسليم عامة عبر `ReplyPayload.delivery`

استخدم الأدوات المساعدة من `openclaw/plugin-sdk/interactive-runtime` عند ربط الكود الأقدم:
__OC_I18N_900011__
يجب أن يقبل الكود الجديد `MessagePresentation` أو ينتجه مباشرة. حمولات `interactive` الحالية هي مجموعة فرعية مهملة من `presentation`؛ ويظل دعم وقت التشغيل متاحًا للمنتجين الأقدم.

أنواع `InteractiveReply*` القديمة وأدوات التحويل المساعدة موسومة بـ `@deprecated` في SDK:

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
`presentationToInteractiveControlsReply(...)` متاحين كجسور عارض لتطبيقات القنوات القديمة. يجب ألا يستدعيهما كود المنتج الجديد؛ أرسل `presentation` ودع تكييف النواة/القناة يتولى العرض.

تتوفر أيضًا بدائل لأدوات الموافقة المساعدة تعتمد على العرض أولًا:

- استخدم `buildApprovalPresentationFromActionDescriptors(...)` بدلًا من
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- استخدم `buildApprovalPresentation(...)` بدلًا من
  `buildApprovalInteractiveReply(...)`
- استخدم `buildExecApprovalPresentation(...)` بدلًا من
  `buildExecApprovalInteractiveReply(...)`

يعيد `renderMessagePresentationFallbackText(...)` سلسلة فارغة لكتل العرض التي لا تملك رجوعًا نصيًا، مثل عرض يحتوي على فاصل فقط. يمكن لوسائل النقل التي تتطلب متن إرسال غير فارغ تمرير `emptyFallback` لاختيار متن أدنى دون تغيير عقد الرجوع الافتراضي.

## تثبيت التسليم

التثبيت سلوك تسليم، وليس عرضًا. استخدم `delivery.pin` بدلًا من الحقول الأصلية للمزوّد مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبّت أول رسالة يتم تسليمها بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- تتدهور حالات فشل التثبيت الاختيارية وتترك الرسالة المرسلة سليمة.
- حالات فشل التثبيت المطلوبة تفشل التسليم.
- الرسائل المجزأة تثبّت أول جزء مُسلَّم، وليس الجزء الأخير.

ما زالت إجراءات رسائل `pin` و`unpin` و`pins` اليدوية موجودة للرسائل الحالية حيث يدعم المزوّد تلك العمليات.

## قائمة تحقق مؤلف Plugin

- أعلن عن `presentation` من `describeMessageTool(...)` عندما تستطيع القناة عرض العرض الدلالي أو تدهوره بأمان.
- أضف `presentationCapabilities` إلى محوّل وقت التشغيل الصادر.
- نفّذ `renderPresentation` في كود وقت التشغيل، وليس في كود إعداد Plugin في مستوى التحكم.
- أبقِ مكتبات الواجهة الأصلية خارج مسارات الإعداد/الفهرس الساخنة.
- أعلن حدود القدرة العامة على `presentationCapabilities.limits` عندما تكون معروفة.
- حافظ على حدود المنصة النهائية في العارض والاختبارات.
- أضف اختبارات رجوع للأزرار غير المدعومة، وعناصر التحديد، وأزرار URL، وتكرار العنوان/النص، وعمليات الإرسال المختلطة التي تجمع `message` مع `presentation`.
- أضف دعم تثبيت التسليم عبر `deliveryCapabilities.pin` و
  `pinDeliveredMessage` فقط عندما يستطيع المزوّد تثبيت معرّف الرسالة المرسلة.
- لا تكشف حقول بطاقة/كتلة/مكوّن/زر أصلية جديدة خاصة بالمزوّد عبر مخطط إجراء الرسائل المشترك.

## المستندات ذات الصلة

- [Message CLI](/ar/cli/message)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [بنية Plugin](/ar/plugins/architecture-internals#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)

---
read_when:
    - إعادة هيكلة واجهة رسائل القنوات، أو الحمولات التفاعلية، أو العارضات الأصلية للقنوات
    - تغيير إمكانات أداة الرسائل، أو تلميحات التسليم، أو العلامات عبر السياقات
    - تصحيح توزيع استيراد Discord Carbon أو الكسل في وقت تشغيل Plugin القناة
summary: افصل العرض الدلالي للرسائل عن العارضات الأصلية لواجهة المستخدم الخاصة بالقناة.
title: خطة إعادة هيكلة عرض القنوات
x-i18n:
    generated_at: "2026-04-24T07:51:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## الحالة

تم التنفيذ على أسطح الوكيل المشترك وCLI وإمكانات Plugin وتسليم الرسائل الصادرة:

- تحمل `ReplyPayload.presentation` واجهة الرسائل الدلالية.
- تحمل `ReplyPayload.delivery.pin` طلبات تثبيت الرسائل المرسلة.
- تكشف إجراءات الرسائل المشتركة `presentation` و`delivery` و`pin` بدلًا من `components` أو `blocks` أو `buttons` أو `card` الخاصة بكل مزوّد.
- يعرض core أو يخفّض presentation تلقائيًا عبر إمكانات الإرسال الصادر التي يعلنها Plugin.
- تستهلك عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu العقد العام.
- لم تعد شيفرة مستوى التحكم في قناة Discord تستورد حاويات واجهة المستخدم المدعومة بـ Carbon.

توجد الوثائق المرجعية الأساسية الآن في [Message Presentation](/ar/plugins/message-presentation).
احتفظ بهذه الخطة كسياق تاريخي للتنفيذ؛ وحدّث الدليل المرجعي
عند تغيّر العقد أو سلوك العارض أو سلوك الرجوع.

## المشكلة

تنقسم واجهة مستخدم القنوات حاليًا عبر عدة أسطح غير متوافقة:

- يمتلك core خطاف عرض عبر السياقات ذا شكل يشبه Discord من خلال `buildCrossContextComponents`.
- يمكن لـ `channel.ts` في Discord استيراد واجهة مستخدم أصلية عبر `DiscordUiContainer`، مما يسحب تبعيات واجهة المستخدم وقت التشغيل إلى مستوى التحكم في Plugin القناة.
- يكشف الوكيل وCLI منافذ هروب لحمولات أصلية مثل `components` الخاصة بـ Discord، و`blocks` الخاصة بـ Slack، و`buttons` الخاصة بـ Telegram أو Mattermost، و`card` الخاصة بـ Teams أو Feishu.
- تحمل `ReplyPayload.channelData` كلًا من تلميحات النقل ومظاريف واجهة المستخدم الأصلية.
- يوجد نموذج `interactive` العام، لكنه أضيق من التخطيطات الأغنى المستخدمة بالفعل في Discord وSlack وTeams وFeishu وLINE وTelegram وMattermost.

يؤدي هذا إلى جعل core واعيًا بأشكال واجهة المستخدم الأصلية، ويضعف الكسل في وقت تشغيل Plugin، ويمنح الوكلاء عددًا كبيرًا جدًا من الطرق الخاصة بالمزوّد للتعبير عن نية الرسالة نفسها.

## الأهداف

- يقرر core أفضل عرض دلالي للرسالة من الإمكانات المعلنة.
- تعلن الامتدادات الإمكانات وتعرض presentation الدلالي داخل حمولة النقل الأصلية.
- تبقى Web Control UI منفصلة عن واجهة المستخدم الأصلية للدردشة.
- لا تُكشف حمولات القنوات الأصلية عبر السطح المشترك للوكيل أو CLI.
- تُخفّض ميزات presentation غير المدعومة تلقائيًا إلى أفضل تمثيل نصي.
- يكون سلوك التسليم مثل تثبيت رسالة مرسلة بيانات وصفية عامة للتسليم، وليس عرضًا.

## ما ليس هدفًا

- لا توجد طبقة توافق رجوعي لـ `buildCrossContextComponents`.
- لا توجد منافذ هروب أصلية عامة لـ `components` أو `blocks` أو `buttons` أو `card`.
- لا توجد استيرادات في core لمكتبات واجهة المستخدم الأصلية الخاصة بالقنوات.
- لا توجد وصلات SDK خاصة بالمزوّد لقنوات مضمّنة.

## النموذج المستهدف

أضف حقل `presentation` مملوكًا لـ core إلى `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

يصبح `interactive` مجموعة فرعية من `presentation` أثناء الترحيل:

- تتحول كتلة نص `interactive` إلى `presentation.blocks[].type = "text"`.
- تتحول كتلة أزرار `interactive` إلى `presentation.blocks[].type = "buttons"`.
- تتحول كتلة اختيار `interactive` إلى `presentation.blocks[].type = "select"`.

تستخدم مخططات الوكيل الخارجي وCLI الآن `presentation`؛ ويظل `interactive` مساعد تحليل/عرض قديمًا داخليًا لمنتجي الردود الحاليين.

## البيانات الوصفية للتسليم

أضف حقل `delivery` مملوكًا لـ core لسلوك الإرسال غير المتعلق بواجهة المستخدم.

```ts
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

الدلالات:

- تعني `delivery.pin = true` تثبيت أول رسالة يتم تسليمها بنجاح.
- تكون `notify` افتراضيًا `false`.
- تكون `required` افتراضيًا `false`؛ وتُخفَّض القنوات غير المدعومة أو فشل التثبيت تلقائيًا عبر متابعة التسليم.
- تبقى إجراءات الرسائل اليدوية `pin` و`unpin` و`list-pins` للرسائل الموجودة.

يجب نقل ربط موضوع ACP الحالي في Telegram من `channelData.telegram.pin = true` إلى `delivery.pin = true`.

## عقد الإمكانات وقت التشغيل

أضف خطافات عرض presentation وتسليم delivery إلى محول الإرسال الصادر وقت التشغيل، وليس إلى Plugin القناة على مستوى التحكم.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

سلوك core:

- حل القناة المستهدفة ومحول وقت التشغيل.
- طلب إمكانات presentation.
- تخفيض الكتل غير المدعومة قبل العرض.
- استدعاء `renderPresentation`.
- إذا لم يوجد عارض، فحوّل presentation إلى رجوع نصي.
- بعد الإرسال الناجح، استدعِ `pinDeliveredMessage` عند طلب `delivery.pin` وعند الدعم.

## تعيين القنوات

Discord:

- اعرض `presentation` إلى components v2 وحاويات Carbon ضمن وحدات وقت تشغيل فقط.
- أبقِ مساعدات لون التمييز في وحدات خفيفة.
- أزل استيرادات `DiscordUiContainer` من شيفرة مستوى التحكم في Plugin القناة.

Slack:

- اعرض `presentation` إلى Block Kit.
- أزل مدخل `blocks` من الوكيل وCLI.

Telegram:

- اعرض النص والسياق والفواصل كنص.
- اعرض الإجراءات والاختيار كلوحات مفاتيح مضمنة عند الإعداد والسماح بها للسطح المستهدف.
- استخدم الرجوع النصي عند تعطيل الأزرار المضمنة.
- انقل تثبيت موضوع ACP إلى `delivery.pin`.

Mattermost:

- اعرض الإجراءات كأزرار تفاعلية عند الإعداد.
- اعرض الكتل الأخرى كرجوع نصي.

MS Teams:

- اعرض `presentation` إلى Adaptive Cards.
- أبقِ إجراءات `pin`/`unpin`/`list-pins` اليدوية.
- نفّذ `pinDeliveredMessage` اختياريًا إذا كانت دعامة Graph موثوقة للمحادثة المستهدفة.

Feishu:

- اعرض `presentation` إلى بطاقات تفاعلية.
- أبقِ إجراءات `pin`/`unpin`/`list-pins` اليدوية.
- نفّذ `pinDeliveredMessage` اختياريًا لتثبيت الرسالة المرسلة إذا كان سلوك API موثوقًا.

LINE:

- اعرض `presentation` إلى رسائل Flex أو template حيثما أمكن.
- ارجع إلى النص عند الكتل غير المدعومة.
- أزل حمولات واجهة LINE من `channelData`.

القنوات العادية أو المحدودة:

- حوّل presentation إلى نص مع تنسيق محافظ.

## خطوات إعادة الهيكلة

1. أعد تطبيق إصلاح إصدار Discord الذي يفصل `ui-colors.ts` عن واجهة المستخدم المدعومة بـ Carbon ويزيل `DiscordUiContainer` من `extensions/discord/src/channel.ts`.
2. أضف `presentation` و`delivery` إلى `ReplyPayload`، وتطبيع الحمولة الصادرة، وملخصات التسليم، وحمولات الخطافات.
3. أضف مخطط `MessagePresentation` ومساعدات التحليل في مسار فرعي ضيق لـ SDK/وقت التشغيل.
4. استبدل إمكانات الرسائل `buttons` و`cards` و`components` و`blocks` بإمكانات presentation الدلالية.
5. أضف خطافات محول الإرسال الصادر وقت التشغيل لعرض presentation وتثبيت delivery.
6. استبدل بناء المكونات عبر السياقات بـ `buildCrossContextPresentation`.
7. احذف `src/infra/outbound/channel-adapters.ts` وأزل `buildCrossContextComponents` من أنواع Plugin القناة.
8. غيّر `maybeApplyCrossContextMarker` بحيث يرفق `presentation` بدلًا من المعلمات الأصلية.
9. حدّث مسارات الإرسال في plugin-dispatch لاستهلاك presentation الدلالي وبيانات delivery الوصفية فقط.
10. أزل معلمات الحمولة الأصلية من الوكيل وCLI: ‏`components` و`blocks` و`buttons` و`card`.
11. أزل مساعدات SDK التي تنشئ مخططات أدوات رسائل أصلية، واستبدلها بمساعدات مخطط presentation.
12. أزل مظاريف واجهة المستخدم/الواجهة الأصلية من `channelData`؛ واحتفظ فقط ببيانات النقل الوصفية إلى أن تتم مراجعة كل حقل متبقٍ.
13. رحّل عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE.
14. حدّث وثائق message CLI، وصفحات القنوات، وPlugin SDK، ودفتر وصفات الإمكانات.
15. شغّل profiling لتوزيع الاستيراد لكل من Discord ونقاط دخول القنوات المتأثرة.

تم تنفيذ الخطوات 1-11 و13-14 في إعادة الهيكلة هذه بالنسبة إلى عقود الوكيل المشترك وCLI وإمكانات Plugin ومحول الإرسال الصادر. أما الخطوة 12 فما تزال تمريرة تنظيف داخلية أعمق لمظاريف النقل `channelData` الخاصة بالمزوّدين. وأما الخطوة 15 فما تزال تحققًا لاحقًا إذا أردنا أرقامًا كمية لتوزيع الاستيراد تتجاوز بوابة الأنواع/الاختبارات.

## الاختبارات

أضف أو حدّث:

- اختبارات تطبيع presentation.
- اختبارات التخفيض التلقائي لـ presentation عند الكتل غير المدعومة.
- اختبارات العلامات عبر السياقات لمسارات plugin-dispatch والتسليم في core.
- اختبارات مصفوفة عرض القنوات لـ Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE والرجوع النصي.
- اختبارات مخطط أداة الرسائل لإثبات اختفاء الحقول الأصلية.
- اختبارات CLI لإثبات اختفاء الأعلام الأصلية.
- اختبار انحدار كسل الاستيراد لنقطة دخول Discord لتغطية Carbon.
- اختبارات تثبيت delivery تغطي Telegram والرجوع العام.

## أسئلة مفتوحة

- هل يجب تنفيذ `delivery.pin` لـ Discord وSlack وMS Teams وFeishu في المرور الأول، أم Telegram فقط أولًا؟
- هل يجب أن يستوعب `delivery` في النهاية حقولًا موجودة مثل `replyToId` و`replyToCurrent` و`silent` و`audioAsVoice`، أم يبقى مركزًا على سلوكيات ما بعد الإرسال؟
- هل يجب أن يدعم presentation الصور أو مراجع الملفات مباشرة، أم تبقى الوسائط منفصلة عن تخطيط واجهة المستخدم في الوقت الحالي؟

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels)
- [Message Presentation](/ar/plugins/message-presentation)

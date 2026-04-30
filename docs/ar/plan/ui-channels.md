---
read_when:
    - إعادة هيكلة واجهة مستخدم رسائل القنوات أو الحمولات التفاعلية أو عارضات القنوات الأصلية
    - تغيير قدرات أداة الرسائل، أو تلميحات التسليم، أو علامات عبر السياقات
    - تصحيح تفرّع استيراد Carbon في Discord أو التحميل الكسول وقت التشغيل لـ Plugin القناة
summary: افصل عرض الرسائل الدلالي عن عارضات واجهة المستخدم الأصلية الخاصة بالقنوات.
title: خطة إعادة هيكلة عرض القناة
x-i18n:
    generated_at: "2026-04-30T08:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## الحالة

مُنفّذ لأسطح الوكيل المشترك، وCLI، وقدرة Plugin، والتسليم الصادر:

- يحمل `ReplyPayload.presentation` واجهة رسائل دلالية.
- يحمل `ReplyPayload.delivery.pin` طلبات تثبيت الرسائل المُرسلة.
- تعرض إجراءات الرسائل المشتركة `presentation` و`delivery` و`pin` بدلًا من `components` أو `blocks` أو `buttons` أو `card` الأصلية الخاصة بالمزوّد.
- يعرض النواة العرض التقديمي أو يخفّضه تلقائيًا عبر قدرات الصادر التي يصرّح بها Plugin.
- تستهلك عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu العقد العام.
- لم تعد شيفرة مستوى التحكم لقناة Discord تستورد حاويات واجهة المستخدم المدعومة بـCarbon.

توجد الوثائق المعتمدة الآن في [عرض الرسائل](/ar/plugins/message-presentation).
أبقِ هذه الخطة كسياق تنفيذ تاريخي؛ وحدّث الدليل المعتمد
عند تغيّر العقد أو العارض أو سلوك الرجوع.

## المشكلة

واجهة مستخدم القنوات مقسّمة حاليًا عبر عدة أسطح غير متوافقة:

- يمتلك النواة خطاف عارض عابر للسياقات على هيئة Discord من خلال `buildCrossContextComponents`.
- يمكن لـ`channel.ts` في Discord استيراد واجهة مستخدم Carbon الأصلية من خلال `DiscordUiContainer`، ما يجلب تبعيات واجهة المستخدم وقت التشغيل إلى مستوى التحكم في Plugin القناة.
- يعرّض الوكيل وCLI منافذ هروب للحِمولات الأصلية مثل `components` في Discord، و`blocks` في Slack، و`buttons` في Telegram أو Mattermost، و`card` في Teams أو Feishu.
- يحمل `ReplyPayload.channelData` كلًا من تلميحات النقل وأغلفة واجهة المستخدم الأصلية.
- يوجد نموذج `interactive` العام، لكنه أضيق من التخطيطات الأغنى المستخدمة بالفعل في Discord وSlack وTeams وFeishu وLINE وTelegram وMattermost.

هذا يجعل النواة على دراية بأشكال واجهة المستخدم الأصلية، ويُضعف كسل تشغيل Plugin، ويمنح الوكلاء طرقًا كثيرة جدًا خاصة بالمزوّد للتعبير عن نية الرسالة نفسها.

## الأهداف

- يقرر النواة أفضل عرض دلالي للرسالة انطلاقًا من القدرات المصرّح بها.
- تصرّح الإضافات بالقدرات وتعرض العرض الدلالي إلى حِمولات نقل أصلية.
- تبقى واجهة Web Control UI منفصلة عن واجهة المحادثة الأصلية.
- لا تُعرض حِمولات القنوات الأصلية عبر سطح رسائل الوكيل المشترك أو CLI.
- تُخفّض ميزات العرض غير المدعومة تلقائيًا إلى أفضل تمثيل نصي.
- سلوك التسليم مثل تثبيت رسالة مُرسلة هو بيانات وصفية عامة للتسليم، وليس عرضًا تقديميًا.

## غير مستهدف

- لا طبقة توافق رجعي لـ`buildCrossContextComponents`.
- لا منافذ هروب عامة أصلية لـ`components` أو `blocks` أو `buttons` أو `card`.
- لا استيرادات في النواة لمكتبات واجهة مستخدم أصلية خاصة بالقنوات.
- لا وصلات SDK خاصة بالمزوّد للقنوات المضمّنة.

## النموذج المستهدف

أضف حقل `presentation` مملوكًا للنواة إلى `ReplyPayload`.

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

- تُطابق كتلة نص `interactive` إلى `presentation.blocks[].type = "text"`.
- تُطابق كتلة أزرار `interactive` إلى `presentation.blocks[].type = "buttons"`.
- تُطابق كتلة اختيار `interactive` إلى `presentation.blocks[].type = "select"`.

تستخدم مخططات الوكيل الخارجي وCLI الآن `presentation`؛ ويبقى `interactive` مساعدًا داخليًا قديمًا للتحليل/العرض لمنتجي الردود الحاليين.

## بيانات التسليم الوصفية

أضف حقل `delivery` مملوكًا للنواة لسلوك الإرسال الذي ليس واجهة مستخدم.

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

- يعني `delivery.pin = true` تثبيت أول رسالة يتم تسليمها بنجاح.
- القيمة الافتراضية لـ`notify` هي `false`.
- القيمة الافتراضية لـ`required` هي `false`؛ القنوات غير المدعومة أو فشل التثبيت يُخفّضان تلقائيًا عبر متابعة التسليم.
- تبقى إجراءات الرسائل اليدوية `pin` و`unpin` و`list-pins` للرسائل الحالية.

يجب نقل ربط موضوع Telegram ACP الحالي من `channelData.telegram.pin = true` إلى `delivery.pin = true`.

## عقد قدرات وقت التشغيل

أضف خطافات عرض وتوصيل للعرض التقديمي والتسليم إلى محوّل الصادر وقت التشغيل، وليس إلى Plugin القناة على مستوى التحكم.

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

سلوك النواة:

- حلّ القناة الهدف ومحوّل وقت التشغيل.
- طلب قدرات العرض التقديمي.
- تخفيض الكتل غير المدعومة قبل العرض.
- استدعاء `renderPresentation`.
- إذا لم يوجد عارض، تحويل العرض التقديمي إلى بديل نصي.
- بعد نجاح الإرسال، استدعاء `pinDeliveredMessage` عند طلب `delivery.pin` ودعمه.

## ربط القنوات

Discord:

- عرض `presentation` إلى components v2 وحاويات Carbon في وحدات وقت التشغيل فقط.
- إبقاء مساعدات لون التمييز في وحدات خفيفة.
- إزالة استيرادات `DiscordUiContainer` من شيفرة مستوى التحكم في Plugin القناة.

Slack:

- عرض `presentation` إلى Block Kit.
- إزالة إدخال `blocks` الخاص بالوكيل وCLI.

Telegram:

- عرض النص والسياق والفواصل كنص.
- عرض الإجراءات والاختيار كلوحات مفاتيح مضمنة عند تهيئتها والسماح بها للسطح الهدف.
- استخدام الرجوع النصي عند تعطيل الأزرار المضمنة.
- نقل تثبيت موضوع ACP إلى `delivery.pin`.

Mattermost:

- عرض الإجراءات كأزرار تفاعلية عند تهيئتها.
- عرض الكتل الأخرى كرجوع نصي.

MS Teams:

- عرض `presentation` إلى Adaptive Cards.
- إبقاء إجراءات التثبيت/إلغاء التثبيت/عرض التثبيتات اليدوية.
- تنفيذ `pinDeliveredMessage` اختياريًا إذا كان دعم Graph موثوقًا للمحادثة الهدف.

Feishu:

- عرض `presentation` إلى بطاقات تفاعلية.
- إبقاء إجراءات التثبيت/إلغاء التثبيت/عرض التثبيتات اليدوية.
- تنفيذ `pinDeliveredMessage` اختياريًا لتثبيت الرسائل المُرسلة إذا كان سلوك API موثوقًا.

LINE:

- عرض `presentation` إلى Flex أو رسائل القوالب حيثما أمكن.
- الرجوع إلى النص للكتل غير المدعومة.
- إزالة حِمولات واجهة مستخدم LINE من `channelData`.

القنوات النصية أو المحدودة:

- تحويل العرض التقديمي إلى نص بتنسيق محافظ.

## خطوات إعادة الهيكلة

1. أعد تطبيق إصلاح إصدار Discord الذي يفصل `ui-colors.ts` عن واجهة المستخدم المدعومة بـCarbon ويزيل `DiscordUiContainer` من `extensions/discord/src/channel.ts`.
2. أضف `presentation` و`delivery` إلى `ReplyPayload`، وتطبيع حِمولة الصادر، وملخصات التسليم، وحِمولات الخطافات.
3. أضف مخطط `MessagePresentation` ومساعدات التحليل في مسار SDK/وقت تشغيل فرعي ضيق.
4. استبدل قدرات الرسائل `buttons` و`cards` و`components` و`blocks` بقدرات عرض دلالية.
5. أضف خطافات محوّل صادر وقت التشغيل لعرض العرض التقديمي وتثبيت التسليم.
6. استبدل إنشاء المكوّنات العابرة للسياقات بـ`buildCrossContextPresentation`.
7. احذف `src/infra/outbound/channel-adapters.ts` وأزل `buildCrossContextComponents` من أنواع Plugin القناة.
8. غيّر `maybeApplyCrossContextMarker` لإرفاق `presentation` بدلًا من المعاملات الأصلية.
9. حدّث مسارات إرسال plugin-dispatch لاستهلاك العرض الدلالي وبيانات التسليم الوصفية فقط.
10. أزل معاملات الحِمولة الأصلية للوكيل وCLI: `components` و`blocks` و`buttons` و`card`.
11. أزل مساعدات SDK التي تنشئ مخططات أدوات الرسائل الأصلية، واستبدلها بمساعدات مخطط العرض التقديمي.
12. أزل أغلفة واجهة المستخدم/الأصلية من `channelData`؛ أبقِ فقط بيانات النقل الوصفية إلى أن تتم مراجعة كل حقل متبقٍ.
13. رحّل عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE.
14. حدّث وثائق CLI الرسائل، وصفحات القنوات، وPlugin SDK، وكتاب وصفات القدرات.
15. شغّل تحليل تفرّع الاستيراد لنقاط دخول Discord والقنوات المتأثرة.

نُفّذت الخطوات 1-11 و13-14 في إعادة الهيكلة هذه لعقود الوكيل المشترك وCLI وقدرة Plugin ومحوّل الصادر. تبقى الخطوة 12 تمريرة تنظيف داخلية أعمق لأغلفة نقل `channelData` الخاصة بالمزوّدين. وتبقى الخطوة 15 تحققًا لاحقًا إذا أردنا أرقامًا كمية لتفرّع الاستيراد تتجاوز بوابة الأنواع/الاختبارات.

## الاختبارات

أضف أو حدّث:

- اختبارات تطبيع العرض التقديمي.
- اختبارات التخفيض التلقائي للعرض التقديمي للكتل غير المدعومة.
- اختبارات علامة السياق العابر لمسارات plugin dispatch والتسليم في النواة.
- اختبارات مصفوفة عارض القنوات لـDiscord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE والرجوع النصي.
- اختبارات مخطط أداة الرسائل التي تثبت اختفاء الحقول الأصلية.
- اختبارات CLI التي تثبت اختفاء الأعلام الأصلية.
- اختبار تراجع كسل الاستيراد لنقطة دخول Discord يغطي Carbon.
- اختبارات تثبيت التسليم التي تغطي Telegram والرجوع العام.

## الأسئلة المفتوحة

- هل ينبغي تنفيذ `delivery.pin` لـDiscord وSlack وMS Teams وFeishu في التمريرة الأولى، أم Telegram فقط أولًا؟
- هل ينبغي أن يستوعب `delivery` في النهاية الحقول الحالية مثل `replyToId` و`replyToCurrent` و`silent` و`audioAsVoice`، أم يبقى مركّزًا على سلوكيات ما بعد الإرسال؟
- هل ينبغي أن يدعم العرض التقديمي الصور أو مراجع الملفات مباشرة، أم يجب أن تبقى الوسائط منفصلة عن تخطيط واجهة المستخدم حاليًا؟

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels)
- [عرض الرسائل](/ar/plugins/message-presentation)

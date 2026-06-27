---
read_when:
    - إعادة هيكلة واجهة مستخدم رسائل القناة أو الحمولات التفاعلية أو عارضات القنوات الأصلية
    - تغيير إمكانات أداة الرسائل أو تلميحات التسليم أو علامات السياقات المتقاطعة
    - تصحيح أخطاء تفرّع استيراد Discord Carbon أو التحميل الكسول في وقت تشغيل Plugin القناة
summary: افصل العرض الدلالي للرسائل عن عارضات واجهة المستخدم الأصلية للقناة.
title: خطة إعادة هيكلة عرض القناة
x-i18n:
    generated_at: "2026-06-27T17:56:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## الحالة

مُنفّذ لأسطح الوكيل المشترك وCLI وقدرة Plugin والتسليم الصادر:

- يحمل `ReplyPayload.presentation` واجهة مستخدم دلالية للرسائل.
- يحمل `ReplyPayload.delivery.pin` طلبات تثبيت الرسائل المُرسلة.
- تعرض إجراءات الرسائل المشتركة `presentation` و`delivery` و`pin` بدلًا من `components` أو `blocks` أو `buttons` أو `card` الأصلية للمزوّد.
- يعرض النواة العرض التقديمي أو يخفّضه تلقائيًا عبر قدرات الصادر التي يعلنها Plugin.
- تستهلك عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu العقد العام.
- لم تعد شيفرة مستوى التحكم لقناة Discord تستورد حاويات واجهة المستخدم المدعومة بـ Carbon.

توجد الوثائق المرجعية الآن في [عرض الرسائل](/ar/plugins/message-presentation).
احتفظ بهذه الخطة كسياق تاريخي للتنفيذ؛ حدّث الدليل المرجعي
عند تغيّر العقد أو العارض أو سلوك الرجوع الاحتياطي.

## المشكلة

واجهة مستخدم القنوات مقسّمة حاليًا عبر عدة أسطح غير متوافقة:

- يملك النواة خطاف عارض عابرًا للسياقات على هيئة Discord عبر `buildCrossContextComponents`.
- يمكن لـ Discord `channel.ts` استيراد واجهة مستخدم Carbon الأصلية عبر `DiscordUiContainer`، ما يسحب اعتماديات واجهة مستخدم وقت التشغيل إلى مستوى التحكم في Plugin القناة.
- يكشف الوكيل وCLI منافذ هروب للحمولات الأصلية مثل `components` في Discord و`blocks` في Slack و`buttons` في Telegram أو Mattermost و`card` في Teams أو Feishu.
- يحمل `ReplyPayload.channelData` تلميحات النقل ومغلفات واجهة المستخدم الأصلية معًا.
- يوجد نموذج `interactive` العام، لكنه أضيق من التخطيطات الأغنى المستخدمة بالفعل في Discord وSlack وTeams وFeishu وLINE وTelegram وMattermost.

هذا يجعل النواة واعيًا بأشكال واجهة المستخدم الأصلية، ويضعف كسولية وقت تشغيل Plugin، ويمنح الوكلاء طرقًا كثيرة جدًا خاصة بالمزوّد للتعبير عن نية الرسالة نفسها.

## الأهداف

- يقرر النواة أفضل عرض دلالي للرسالة من القدرات المُعلنة.
- تعلن الإضافات القدرات وتعرض العرض الدلالي إلى حمولات النقل الأصلية.
- تبقى واجهة تحكم الويب منفصلة عن واجهة المستخدم الأصلية للمحادثة.
- لا تُكشف حمولات القنوات الأصلية عبر سطح رسائل الوكيل المشترك أو CLI.
- تنخفض ميزات العرض غير المدعومة تلقائيًا إلى أفضل تمثيل نصي.
- يكون سلوك التسليم مثل تثبيت رسالة مُرسلة بيانات تعريف عامة للتسليم، لا عرضًا تقديميًا.

## ليست أهدافًا

- لا توجد طبقة توافق رجعي لـ `buildCrossContextComponents`.
- لا توجد منافذ هروب أصلية عامة لـ `components` أو `blocks` أو `buttons` أو `card`.
- لا توجد استيرادات في النواة لمكتبات واجهة المستخدم الأصلية للقنوات.
- لا توجد طبقات SDK خاصة بالمزوّد للقنوات المضمّنة.

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

- تُطابق كتلة النص في `interactive` إلى `presentation.blocks[].type = "text"`.
- تُطابق كتلة الأزرار في `interactive` إلى `presentation.blocks[].type = "buttons"`.
- تُطابق كتلة الاختيار في `interactive` إلى `presentation.blocks[].type = "select"`.

تستخدم مخططات الوكيل الخارجي وCLI الآن `presentation`؛ ويبقى `interactive` مساعد تحليل/عرض داخليًا قديمًا لمنتجي الردود الحاليين.
تعامل واجهة API العامة الموجّهة للمنتجين `interactive` على أنه مهمل. يبقى دعم وقت التشغيل حتى تستمر مساعدات الموافقة الحالية وPlugins الأقدم في العمل بينما تصدر الشيفرة الجديدة `presentation`.

## بيانات تعريف التسليم

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

- يعني `delivery.pin = true` تثبيت أول رسالة تُسلَّم بنجاح.
- تكون القيمة الافتراضية لـ `notify` هي `false`.
- تكون القيمة الافتراضية لـ `required` هي `false`؛ تنخفض القنوات غير المدعومة أو فشل التثبيت تلقائيًا عبر متابعة التسليم.
- تبقى إجراءات الرسائل اليدوية `pin` و`unpin` و`list-pins` للرسائل الحالية.

يجب نقل ربط موضوع Telegram ACP الحالي من `channelData.telegram.pin = true` إلى `delivery.pin = true`.

## عقد قدرة وقت التشغيل

أضف خطافات عرض وتسليم للعرض التقديمي إلى مهايئ الصادر في وقت التشغيل، وليس إلى Plugin القناة في مستوى التحكم.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- حلّ القناة المستهدفة ومهايئ وقت التشغيل.
- طلب قدرات العرض التقديمي.
- تخفيض الكتل غير المدعومة وتطبيق حدود القدرات العامة قبل
  العرض.
- استدعاء `renderPresentation`.
- إذا لم يوجد عارض، حوّل العرض التقديمي إلى رجوع احتياطي نصي.
- بعد الإرسال الناجح، استدعِ `pinDeliveredMessage` عندما يُطلب `delivery.pin` ويكون مدعومًا.

## تخطيط القنوات

Discord:

- اعرض `presentation` إلى components v2 وحاويات Carbon في وحدات وقت التشغيل فقط.
- أبقِ مساعدات لون التمييز في وحدات خفيفة.
- أزِل استيرادات `DiscordUiContainer` من شيفرة مستوى التحكم في Plugin القناة.

Slack:

- اعرض `presentation` إلى Block Kit.
- أزِل إدخال `blocks` للوكيل وCLI.

Telegram:

- اعرض النص والسياق والفواصل كنص.
- اعرض الإجراءات والاختيار كلوحات مفاتيح مضمنة عند تكوينها والسماح بها للسطح المستهدف.
- استخدم الرجوع الاحتياطي النصي عندما تكون الأزرار المضمنة معطلة.
- انقل تثبيت موضوع ACP إلى `delivery.pin`.

Mattermost:

- اعرض الإجراءات كأزرار تفاعلية حيثما تم تكوين ذلك.
- اعرض الكتل الأخرى كرجوع احتياطي نصي.

MS Teams:

- اعرض `presentation` إلى Adaptive Cards.
- أبقِ إجراءات التثبيت/إلغاء التثبيت/سرد التثبيتات اليدوية.
- نفّذ اختياريًا `pinDeliveredMessage` إذا كان دعم Graph موثوقًا للمحادثة المستهدفة.

Feishu:

- اعرض `presentation` إلى بطاقات تفاعلية.
- أبقِ إجراءات التثبيت/إلغاء التثبيت/سرد التثبيتات اليدوية.
- نفّذ اختياريًا `pinDeliveredMessage` لتثبيت الرسالة المُرسلة إذا كان سلوك API موثوقًا.

LINE:

- اعرض `presentation` إلى رسائل Flex أو القوالب حيثما أمكن.
- ارجع إلى النص للكتل غير المدعومة.
- أزِل حمولات واجهة مستخدم LINE من `channelData`.

القنوات النصية أو المحدودة:

- حوّل العرض التقديمي إلى نص بتنسيق محافظ.

## خطوات إعادة الهيكلة

1. أعد تطبيق إصلاح إصدار Discord الذي يفصل `ui-colors.ts` عن واجهة المستخدم المدعومة بـ Carbon ويزيل `DiscordUiContainer` من `extensions/discord/src/channel.ts`.
2. أضف `presentation` و`delivery` إلى `ReplyPayload`، وتسوية حمولة الصادر، وملخصات التسليم، وحمولات الخطافات.
3. أضف مخطط `MessagePresentation` ومساعدات التحليل في مسار فرعي ضيق لـ SDK/وقت التشغيل.
4. استبدل قدرات الرسائل `buttons` و`cards` و`components` و`blocks` بقدرات العرض التقديمي الدلالية.
5. أضف خطافات مهايئ الصادر في وقت التشغيل لعرض العرض التقديمي وتثبيت التسليم.
6. استبدل إنشاء المكونات العابرة للسياقات بـ `buildCrossContextPresentation`.
7. احذف `src/infra/outbound/channel-adapters.ts` وأزل `buildCrossContextComponents` من أنواع Plugin القناة.
8. غيّر `maybeApplyCrossContextMarker` لإرفاق `presentation` بدلًا من المعلمات الأصلية.
9. حدّث مسارات إرسال توزيع Plugins لاستهلاك العرض التقديمي الدلالي وبيانات تعريف التسليم فقط.
10. أزِل معلمات الحمولات الأصلية من الوكيل وCLI: `components` و`blocks` و`buttons` و`card`.
11. أزِل مساعدات SDK التي تنشئ مخططات أدوات الرسائل الأصلية، واستبدلها بمساعدات مخطط العرض التقديمي.
12. أزِل مغلفات واجهة المستخدم/الأصلية من `channelData`؛ أبقِ بيانات تعريف النقل فقط حتى تتم مراجعة كل حقل متبقٍ.
13. رحّل عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE.
14. حدّث الوثائق لـCLI الرسائل وصفحات القنوات وPlugin SDK وكتاب وصفات القدرات.
15. شغّل تحليل تفرّع الاستيراد لنقاط دخول Discord والقنوات المتأثرة.

تم تنفيذ الخطوات 1-11 و13-14 في إعادة الهيكلة هذه لعقود الوكيل المشترك وCLI وقدرة Plugin ومهايئ الصادر. تبقى الخطوة 12 جولة تنظيف داخلي أعمق لمغلفات نقل `channelData` الخاصة بالمزوّد. تبقى الخطوة 15 تحققًا لاحقًا إذا أردنا أرقام تفرّع استيراد كمّية تتجاوز بوابة الأنواع/الاختبارات.

## الاختبارات

أضف أو حدّث:

- اختبارات تسوية العرض التقديمي.
- اختبارات التخفيض التلقائي للعرض التقديمي للكتل غير المدعومة.
- اختبارات علامة العبور بين السياقات لمسارات توزيع Plugins والتسليم في النواة.
- اختبارات مصفوفة عرض القنوات لـ Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE والرجوع الاحتياطي النصي.
- اختبارات مخطط أداة الرسائل التي تثبت زوال الحقول الأصلية.
- اختبارات CLI التي تثبت زوال الأعلام الأصلية.
- انحدار كسولية استيراد نقطة دخول Discord الذي يغطي Carbon.
- اختبارات تثبيت التسليم التي تغطي Telegram والرجوع الاحتياطي العام.

## الأسئلة المفتوحة

- هل يجب تنفيذ `delivery.pin` لـ Discord وSlack وMS Teams وFeishu في المرور الأول، أم Telegram فقط أولًا؟
- هل يجب أن يستوعب `delivery` في النهاية الحقول الحالية مثل `replyToId` و`replyToCurrent` و`silent` و`audioAsVoice`، أم يبقى مركّزًا على سلوكيات ما بعد الإرسال؟
- هل يجب أن يدعم العرض التقديمي الصور أو مراجع الملفات مباشرة، أم يجب أن تبقى الوسائط منفصلة عن تخطيط واجهة المستخدم في الوقت الحالي؟

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels)
- [عرض الرسائل](/ar/plugins/message-presentation)

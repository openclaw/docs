---
read_when:
    - إعادة هيكلة واجهة مستخدم رسائل القنوات، أو الحمولات التفاعلية، أو أدوات التصيير الأصلية للقنوات
    - تغيير إمكانات أداة الرسائل أو تلميحات التسليم أو علامات السياقات المتقاطعة
    - تصحيح أخطاء تفرّع استيراد Discord Carbon أو التحميل الكسول لوقت تشغيل Plugin القناة
summary: افصل عرض الرسائل الدلالي عن عارضات واجهة المستخدم الأصلية للقنوات.
title: خطة إعادة هيكلة عرض القنوات
x-i18n:
    generated_at: "2026-07-12T06:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## الحالة

نُفِّذ ذلك للوكيل المشترك، وCLI، وإمكانات Plugin، وأسطح التسليم الصادر:

- يحمل `ReplyPayload.presentation` واجهة مستخدم دلالية للرسائل.
- يحمل `ReplyPayload.delivery.pin` طلبات تثبيت الرسائل المُرسلة.
- تعرض إجراءات الرسائل المشتركة `presentation` و`delivery` و`pin` بدلًا من `components` أو `blocks` أو `buttons` أو `card` الأصلية الخاصة بمزوّد الخدمة.
- يعرض النواة العرض التقديمي أو يخفض إمكاناته تلقائيًا عبر إمكانات الإرسال الصادر المعلنة من Plugin.
- تستهلك عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu العقد العام.
- لم تعد شيفرة مستوى التحكم لقناة Discord تستورد حاويات واجهة المستخدم المدعومة بـ Carbon.

أصبحت الوثائق المعتمدة الآن في [عرض الرسائل](/ar/plugins/message-presentation).
احتفظ بهذه الخطة كسياق تاريخي للتنفيذ؛ وحدّث الدليل المعتمد
عند تغيير العقد أو العارض أو سلوك الرجوع الاحتياطي.

## المشكلة

تنقسم واجهة مستخدم القنوات حاليًا بين عدة أسطح غير متوافقة:

- تمتلك النواة خطاف عارض متعدد السياقات على هيئة Discord من خلال `buildCrossContextComponents`.
- يمكن لملف `channel.ts` في Discord استيراد واجهة مستخدم Carbon الأصلية من خلال `DiscordUiContainer`، مما يجلب تبعيات واجهة المستخدم في وقت التشغيل إلى مستوى التحكم في Plugin القناة.
- يكشف الوكيل وCLI منافذ تجاوز للحمولات الأصلية، مثل `components` في Discord، و`blocks` في Slack، و`buttons` في Telegram أو Mattermost، و`card` في Teams أو Feishu.
- يحمل `ReplyPayload.channelData` تلميحات النقل وأغلفة واجهة المستخدم الأصلية معًا.
- يوجد نموذج `interactive` العام، لكنه أضيق من التخطيطات الأغنى المستخدمة بالفعل في Discord وSlack وTeams وFeishu وLINE وTelegram وMattermost.

يجعل هذا النواة على دراية ببُنى واجهات المستخدم الأصلية، ويضعف التحميل الكسول لوقت تشغيل Plugin، ويمنح الوكلاء طرقًا كثيرة خاصة بمزوّدي الخدمة للتعبير عن مقصد الرسالة نفسه.

## الأهداف

- تحدد النواة أفضل عرض دلالي للرسالة استنادًا إلى الإمكانات المعلنة.
- تعلن الامتدادات عن الإمكانات وتحوّل العرض الدلالي إلى حمولات نقل أصلية.
- تظل واجهة التحكم عبر الويب منفصلة عن واجهة المستخدم الأصلية للمحادثة.
- لا تُكشف حمولات القنوات الأصلية من خلال سطح الرسائل المشترك للوكيل أو CLI.
- تُخفَّض ميزات العرض غير المدعومة تلقائيًا إلى أفضل تمثيل نصي.
- يُعد سلوك التسليم، مثل تثبيت رسالة مُرسلة، بيانات وصفية عامة للتسليم وليس عرضًا تقديميًا.

## غير مستهدف

- لا توجد طبقة توافق مع الإصدارات السابقة لـ `buildCrossContextComponents`.
- لا توجد منافذ تجاوز أصلية عامة لـ `components` أو `blocks` أو `buttons` أو `card`.
- لا تستورد النواة مكتبات واجهة المستخدم الأصلية الخاصة بالقنوات.
- لا توجد واجهات SDK خاصة بمزوّدي الخدمة للقنوات المضمّنة.

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

- تُطابق كتلة النص في `interactive` القيمة `presentation.blocks[].type = "text"`.
- تُطابق كتلة الأزرار في `interactive` القيمة `presentation.blocks[].type = "buttons"`.
- تُطابق كتلة التحديد في `interactive` القيمة `presentation.blocks[].type = "select"`.

تستخدم مخططات الوكيل الخارجي وCLI الآن `presentation`؛ ويظل `interactive` مساعدًا داخليًا قديمًا للتحليل والعرض من أجل منتجي الردود الحاليين.
تعامل واجهة API العامة الموجّهة للمنتجين `interactive` بوصفه مهملًا. يظل دعم وقت التشغيل
قائمًا لكي تستمر أدوات الموافقة المساعدة الحالية وملحقات Plugin الأقدم في
العمل، بينما تُصدر الشيفرة الجديدة `presentation`.

## البيانات الوصفية للتسليم

أضف حقل `delivery` مملوكًا للنواة لسلوك الإرسال غير المتعلق بواجهة المستخدم.

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

- تعني `delivery.pin = true` تثبيت أول رسالة يُسلَّم إرسالها بنجاح.
- القيمة الافتراضية لـ `notify` هي `false`.
- القيمة الافتراضية لـ `required` هي `false`؛ وتُخفّض القنوات غير المدعومة أو حالات فشل التثبيت تلقائيًا عبر متابعة التسليم.
- تظل إجراءات الرسائل اليدوية `pin` و`unpin` و`list-pins` متاحة للرسائل الحالية.

يجب نقل ربط موضوع ACP الحالي في Telegram من `channelData.telegram.pin = true` إلى `delivery.pin = true`.

## عقد إمكانات وقت التشغيل

أضف خطافات عرض العرض التقديمي والتسليم إلى محوّل الإرسال الصادر في وقت التشغيل، لا إلى Plugin القناة في مستوى التحكم.

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

- حلّ القناة المستهدفة ومحوّل وقت التشغيل.
- طلب إمكانات العرض التقديمي.
- خفض الكتل غير المدعومة وتطبيق حدود الإمكانات العامة قبل
  العرض.
- استدعاء `renderPresentation`.
- إذا لم يوجد عارض، فحوّل العرض التقديمي إلى نص احتياطي.
- بعد نجاح الإرسال، استدعِ `pinDeliveredMessage` عندما يكون `delivery.pin` مطلوبًا ومدعومًا.

## ربط القنوات

Discord:

- اعرض `presentation` كمكوّنات v2 وحاويات Carbon في وحدات خاصة بوقت التشغيل.
- احتفظ بأدوات ألوان التمييز المساعدة في وحدات خفيفة.
- أزل استيرادات `DiscordUiContainer` من شيفرة مستوى التحكم في Plugin القناة.

Slack:

- اعرض `presentation` بصيغة Block Kit.
- أزل إدخال `blocks` من الوكيل وCLI.

Telegram:

- اعرض النص والسياق والفواصل كنص.
- اعرض الإجراءات والتحديد كلوحات مفاتيح مضمنة عند تهيئتها والسماح بها للسطح المستهدف.
- استخدم النص الاحتياطي عندما تكون الأزرار المضمنة معطلة.
- انقل تثبيت موضوع ACP إلى `delivery.pin`.

Mattermost:

- اعرض الإجراءات كأزرار تفاعلية عند تهيئتها.
- اعرض الكتل الأخرى كنص احتياطي.

MS Teams:

- اعرض `presentation` بصيغة Adaptive Cards.
- احتفظ بإجراءات التثبيت وإلغاء التثبيت وسرد العناصر المثبّتة يدويًا.
- نفّذ `pinDeliveredMessage` اختياريًا إذا كان دعم Graph موثوقًا للمحادثة المستهدفة.

Feishu:

- اعرض `presentation` كبطاقات تفاعلية.
- احتفظ بإجراءات التثبيت وإلغاء التثبيت وسرد العناصر المثبّتة يدويًا.
- نفّذ `pinDeliveredMessage` اختياريًا لتثبيت الرسائل المُرسلة إذا كان سلوك API موثوقًا.

LINE:

- اعرض `presentation` كرسائل Flex أو رسائل قوالب حيثما أمكن.
- ارجع إلى النص للكتل غير المدعومة.
- أزل حمولات واجهة مستخدم LINE من `channelData`.

القنوات النصية أو محدودة الإمكانات:

- حوّل العرض التقديمي إلى نص بتنسيق متحفظ.

## خطوات إعادة الهيكلة

1. أعد تطبيق إصلاح إصدار Discord الذي يفصل `ui-colors.ts` عن واجهة المستخدم المدعومة بـ Carbon ويزيل `DiscordUiContainer` من `extensions/discord/src/channel.ts`.
2. أضف `presentation` و`delivery` إلى `ReplyPayload`، وتطبيع الحمولة الصادرة، وملخصات التسليم، وحمولات الخطافات.
3. أضف مخطط `MessagePresentation` وأدوات التحليل المساعدة في مسار فرعي ضيق لـ SDK/وقت التشغيل.
4. استبدل إمكانات الرسائل `buttons` و`cards` و`components` و`blocks` بإمكانات العرض الدلالي.
5. أضف خطافات محوّل الإرسال الصادر في وقت التشغيل لعرض العرض التقديمي وتثبيت التسليم.
6. استبدل إنشاء المكوّنات متعددة السياقات بـ `buildCrossContextPresentation`.
7. احذف `src/infra/outbound/channel-adapters.ts` وأزل `buildCrossContextComponents` من أنواع Plugin القناة.
8. غيّر `maybeApplyCrossContextMarker` لإرفاق `presentation` بدلًا من المعاملات الأصلية.
9. حدّث مسارات إرسال توزيع Plugin لتستهلك العرض الدلالي والبيانات الوصفية للتسليم فقط.
10. أزل معاملات الحمولة الأصلية من الوكيل وCLI: `components` و`blocks` و`buttons` و`card`.
11. أزل أدوات SDK المساعدة التي تنشئ مخططات أدوات رسائل أصلية، واستبدلها بأدوات مساعدة لمخطط العرض التقديمي.
12. أزل أغلفة واجهة المستخدم/الأغلفة الأصلية من `channelData`؛ واحتفظ ببيانات النقل الوصفية فقط حتى تتم مراجعة كل حقل متبقٍ.
13. رحّل عارضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE.
14. حدّث وثائق CLI للرسائل وصفحات القنوات وSDK الخاص بـ Plugin ودليل الإمكانات العملي.
15. شغّل تحليل انتشار الاستيراد لنقاط دخول Discord والقنوات المتأثرة.

نُفِّذت الخطوات 1-11 و13-14 في إعادة الهيكلة هذه لعقود الوكيل المشترك وCLI وإمكانات Plugin ومحوّل الإرسال الصادر. تظل الخطوة 12 جولة تنظيف داخلية أعمق لأغلفة النقل الخاصة بمزوّدي الخدمة في `channelData`. وتظل الخطوة 15 تحققًا لاحقًا إذا أردنا أرقامًا كمية لانتشار الاستيراد تتجاوز بوابة الأنواع/الاختبارات.

## الاختبارات

أضف أو حدّث:

- اختبارات تطبيع العرض التقديمي.
- اختبارات الخفض التلقائي للعرض التقديمي عند وجود كتل غير مدعومة.
- اختبارات علامات تعدد السياقات لمسارات توزيع Plugin والتسليم في النواة.
- اختبارات مصفوفة عرض القنوات لـ Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE والنص الاحتياطي.
- اختبارات مخطط أداة الرسائل التي تثبت إزالة الحقول الأصلية.
- اختبارات CLI التي تثبت إزالة الخيارات الأصلية.
- اختبار انحدار التحميل الكسول لاستيرادات نقطة دخول Discord يشمل Carbon.
- اختبارات تثبيت التسليم التي تشمل Telegram والرجوع الاحتياطي العام.

## أسئلة مفتوحة

- هل ينبغي تنفيذ `delivery.pin` لـ Discord وSlack وMS Teams وFeishu في الجولة الأولى، أم لـ Telegram فقط أولًا؟
- هل ينبغي أن يستوعب `delivery` في النهاية الحقول الحالية مثل `replyToId` و`replyToCurrent` و`silent` و`audioAsVoice`، أم يظل مركزًا على سلوكيات ما بعد الإرسال؟
- هل ينبغي أن يدعم العرض التقديمي الصور أو مراجع الملفات مباشرةً، أم ينبغي أن تظل الوسائط منفصلة عن تخطيط واجهة المستخدم في الوقت الحالي؟

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels)
- [عرض الرسائل](/ar/plugins/message-presentation)

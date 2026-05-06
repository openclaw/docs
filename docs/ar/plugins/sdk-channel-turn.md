---
read_when:
    - أنت تبني Plugin قناة وتريد دورة حياة الدور الوارد المشتركة
    - أنت ترحّل مراقب قناة بعيدًا عن شيفرة الربط اليدوية للتسجيل/الإرسال
    - تحتاج إلى فهم مراحل القبول والاستيعاب والتصنيف والتحقق المسبق والحل والتسجيل والإرسال والإتمام.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- نواة الدورات الواردة المشتركة التي تستخدمها Plugins القنوات المضمّنة والتابعة لأطراف خارجية لتسجيل دورات الوكيل وتوجيهها وإنهائها
title: نواة دور القناة
x-i18n:
    generated_at: "2026-05-06T08:07:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

نواة دور القناة هي آلة الحالة الواردة المشتركة التي تحوّل حدث منصة مُطبّعًا إلى دور وكيل. توفّر Plugins القنوات حقائق المنصة واستدعاء التسليم. يتولى Core التنسيق: الاستيعاب، والتصنيف، والفحص الأولي، والحل، والتفويض، والتجميع، والتسجيل، والإرسال، والإنهاء.

استخدم هذا عندما يكون Plugin الخاص بك ضمن المسار الساخن للرسائل الواردة. للأحداث غير الرسائل (أوامر الشرطة المائلة، والنوافذ المنبثقة، وتفاعلات الأزرار، وأحداث دورة الحياة، والتفاعلات، وحالة الصوت)، أبقها محلية داخل Plugin. لا تملك النواة إلا الأحداث التي قد تصبح دورًا نصيًا للوكيل.

<Info>
  يتم الوصول إلى النواة عبر وقت تشغيل Plugin المحقون باسم `runtime.channel.turn.*`. يتم تصدير نوع وقت تشغيل Plugin من `openclaw/plugin-sdk/core`، لذلك يمكن لـ Plugins الأصلية التابعة لجهات خارجية استخدام نقاط الدخول هذه بالطريقة نفسها التي تستخدمها Plugins القنوات المضمّنة.
</Info>

## لماذا توجد نواة مشتركة

تكرّر Plugins القنوات التدفق الوارد نفسه: التطبيع، والتوجيه، والحجب، وبناء سياق، وتسجيل بيانات تعريف الجلسة، وإرسال دور الوكيل، وإنهاء حالة التسليم. من دون نواة مشتركة، يجب تطبيق أي تغيير على حجب الإشارات، أو الردود المرئية الخاصة بالأدوات فقط، أو بيانات تعريف الجلسة، أو السجل المعلّق، أو إنهاء الإرسال على كل قناة على حدة.

تُبقي النواة أربعة مفاهيم منفصلة عمدًا:

- `ConversationFacts`: من أين أتت الرسالة
- `RouteFacts`: أي وكيل وأي جلسة يجب أن يعالجاها
- `ReplyPlanFacts`: أين يجب أن تذهب الردود المرئية
- `MessageFacts`: ما النص والسياق التكميلي الذي يجب أن يراه الوكيل

تميّز رسائل Slack المباشرة، وموضوعات Telegram، وخيوط Matrix، وجلسات موضوع Feishu، كل هذه عمليًا. التعامل معها كمعرّف واحد يسبب انحرافًا بمرور الوقت.

## دورة حياة المرحلة

تشغّل النواة المسار الثابت نفسه بغض النظر عن القناة:

1. `ingest` -- يحوّل المحوّل حدث منصة خامًا إلى `NormalizedTurnInput`
2. `classify` -- يعلن المحوّل ما إذا كان هذا الحدث يمكنه بدء دور وكيل
3. `preflight` -- يجري المحوّل إزالة التكرار، وصدى الذات، والإماهة، والتأخير القصير، وفك التشفير، والتعبئة الجزئية المسبقة للحقائق
4. `resolve` -- يعيد المحوّل دورًا مجمّعًا بالكامل (التوجيه، وخطة الرد، والرسالة، والتسليم)
5. `authorize` -- تُطبّق سياسة الرسائل المباشرة، والمجموعات، والإشارات، والأوامر على الحقائق المجمّعة
6. `assemble` -- يُبنى `FinalizedMsgContext` من الحقائق عبر `buildContext`
7. `record` -- تُحفظ بيانات تعريف الجلسة الواردة وآخر توجيه
8. `dispatch` -- يُنفّذ دور الوكيل عبر مرسل الكتل المخزّن مؤقتًا
9. `finalize` -- يعمل `onFinalize` الخاص بالمحوّل حتى عند حدوث خطأ في الإرسال

تصدر كل مرحلة حدث سجل منظّمًا عند توفير استدعاء `log`. راجع [قابلية المراقبة](#observability).

## أنواع القبول

لا ترمي النواة خطأ عندما يُحجب دور. بل تعيد `ChannelTurnAdmission`:

| النوع          | متى                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | يُقبل الدور. يعمل دور الوكيل ويُستخدم مسار الرد المرئي.                                                                   |
| `observeOnly` | يعمل الدور من البداية إلى النهاية لكن محوّل التسليم لا يرسل شيئًا مرئيًا. يُستخدم لوكلاء مراقبة البث وتدفقات الوكلاء المتعددين السلبية الأخرى. |
| `handled`     | استُهلك حدث منصة محليًا (دورة حياة، تفاعل، زر، نافذة منبثقة). تتخطى النواة الإرسال.                                           |
| `drop`        | مسار تخطٍّ. اختياريًا، يبقي `recordHistory: true` الرسالة في سجل المجموعة المعلّق بحيث تملك إشارة مستقبلية سياقًا.                      |

يمكن أن يأتي القبول من `classify` (فئة الحدث قالت إنه لا يمكنه بدء دور)، أو من `preflight` (إزالة التكرار، صدى الذات، إشارة مفقودة مع تسجيل السجل)، أو من `resolveTurn` نفسه.

## نقاط الدخول

يكشف وقت التشغيل ثلاث نقاط دخول مفضلة حتى تتمكن المحوّلات من الاشتراك بالمستوى الذي يطابق القناة.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

يبقى مساعدا وقت تشغيل أقدم متاحين لتوافق Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

استخدمه عندما تستطيع قناتك التعبير عن تدفقها الوارد بوصفه `ChannelTurnAdapter<TRaw>`. يحتوي المحوّل على استدعاءات لـ `ingest`، و`classify` اختياري، و`preflight` اختياري، و`resolveTurn` إلزامي، و`onFinalize` اختياري.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` هو الشكل المناسب عندما تكون لدى القناة منطق محوّل صغير وتستفيد من امتلاك دورة الحياة عبر الخطافات.

### runPrepared

استخدمه عندما تكون لدى القناة مرسلة محلية معقدة تتضمن معاينات أو إعادة محاولات أو تعديلات أو تمهيد خيوط يجب أن تبقى مملوكة للقناة. تظل النواة تسجل الجلسة الواردة قبل الإرسال وتعرض `DispatchedChannelTurnResult` موحدًا.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

تستخدم القنوات الغنية (Matrix، وMattermost، وMicrosoft Teams، وFeishu، وQQ Bot) `runPrepared` لأن مرسلتها تنسق سلوكًا خاصًا بالمنصة لا يجب على النواة معرفته.

### buildContext

دالة نقية تعيّن حزم الحقائق إلى `FinalizedMsgContext`. استخدمها عندما تنفّذ قناتك جزءًا من المسار يدويًا لكنها تريد شكل سياق متسقًا.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

يكون `buildContext` مفيدًا أيضًا داخل استدعاءات `resolveTurn` عند تجميع دور لـ `run`.

<Note>
  لا تزال مساعدات SDK المهملة مثل `dispatchInboundReplyWithBase` تجسر عبر مساعد دور مجمّع. يجب أن تستخدم شيفرة Plugin الجديدة `run` أو `runPrepared`.
</Note>

## أنواع الحقائق

الحقائق التي تستهلكها النواة من محوّلك لا تعتمد على المنصة. ترجم كائنات المنصة إلى هذه الأشكال قبل تسليمها إلى النواة.

### NormalizedTurnInput

| الحقل             | الغرض                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | معرّف رسالة ثابت يُستخدم لإزالة التكرار والسجلات                                   |
| `timestamp`       | وقت epoch اختياري بالمللي ثانية                                                            |
| `rawText`         | النص كما استُلم من المنصة                                           |
| `textForAgent`    | نص منظّف اختياري للوكيل (إزالة الإشارة، تشذيب الكتابة)             |
| `textForCommands` | نص اختياري يُستخدم لتحليل `/command`                                    |
| `raw`             | مرجع تمرير اختياري لاستدعاءات المحوّل التي تحتاج إلى الأصل |

### ChannelEventClass

| الحقل                  | الغرض                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`، `command`، `interaction`، `reaction`، `lifecycle`، `unknown` |
| `canStartAgentTurn`    | إذا كان false فتعيد النواة `{ kind: "handled" }`                       |
| `requiresImmediateAck` | تلميح للمحوّلات التي تحتاج إلى ACK قبل الإرسال                      |

### SenderFacts

| الحقل          | الغرض                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | معرّف مرسل ثابت في المنصة                                      |
| `name`         | اسم العرض                                                   |
| `username`     | المعرّف إذا كان مختلفًا عن `name`                                 |
| `tag`          | مميّز على نمط Discord أو وسم منصة                    |
| `roles`        | معرّفات الأدوار، تُستخدم لمطابقة قائمة السماح الخاصة بأدوار الأعضاء              |
| `isBot`        | true عندما يكون المرسل بوتًا معروفًا (تستخدمها النواة للإسقاط) |
| `isSelf`       | true عندما يكون المرسل هو الوكيل المكوّن نفسه            |
| `displayLabel` | تسمية معروضة مسبقًا لنص الغلاف                           |

### ConversationFacts

| الحقل             | الغرض                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`، أو `group`، أو `channel`                                      |
| `id`              | معرّف المحادثة المستخدم للتوجيه                                     |
| `label`           | تسمية بشرية للغلاف                                         |
| `spaceId`         | معرّف مساحة خارجي اختياري (مساحة عمل Slack، خادم Matrix منزلي) |
| `parentId`        | معرّف المحادثة الخارجي عندما يكون هذا خيطًا                          |
| `threadId`        | معرّف الخيط عندما تكون هذه الرسالة داخل خيط                       |
| `nativeChannelId` | معرّف القناة الأصلي في المنصة عندما يختلف عن معرّف التوجيه        |
| `routePeer`       | النظير المستخدم للبحث عبر `resolveAgentRoute`                             |

### RouteFacts

| الحقل                   | الغرض                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | الوكيل الذي يجب أن يتعامل مع هذا الدور                         |
| `accountId`             | تجاوز اختياري (القنوات متعددة الحسابات)                 |
| `routeSessionKey`       | مفتاح الجلسة المستخدم للتوجيه                               |
| `dispatchSessionKey`    | مفتاح الجلسة المستخدم عند الإرسال عندما يختلف عن مفتاح التوجيه |
| `persistedSessionKey`   | مفتاح الجلسة المكتوب إلى بيانات تعريف الجلسة المحفوظة          |
| `parentSessionKey`      | الأصل للجلسات المتفرعة/ذات الخيوط                      |
| `modelParentSessionKey` | الأصل من جانب النموذج للجلسات المتفرعة                    |
| `mainSessionKey`        | تثبيت مالك الرسائل المباشرة الرئيسي للمحادثات المباشرة                 |
| `createIfMissing`       | السماح لخطوة التسجيل بإنشاء صف جلسة مفقود          |

### ReplyPlanFacts

| الحقل                    | الغرض                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | هدف الرد المنطقي المكتوب في السياق `To`                 |
| `originatingTo`           | هدف السياق الأصلي (`OriginatingTo`)                     |
| `nativeChannelId`         | معرّف القناة الأصلي للمنصة للتسليم                      |
| `replyTarget`             | وجهة الرد المرئي النهائية إذا كانت تختلف عن `to`        |
| `deliveryTarget`          | تجاوز التسليم في المستوى الأدنى                         |
| `replyToId`               | معرّف الرسالة المقتبسة/المثبتة                          |
| `replyToIdFull`           | المعرّف المقتبس بصيغته الكاملة عندما تدعم المنصة كليهما |
| `messageThreadId`         | معرّف السلسلة وقت التسليم                               |
| `threadParentId`          | معرّف الرسالة الأصلية للسلسلة                           |
| `sourceReplyDeliveryMode` | `thread` أو `reply` أو `channel` أو `direct` أو `none`  |

### AccessFacts

يحمل `AccessFacts` القيم المنطقية التي تحتاجها مرحلة التفويض. تبقى مطابقة الهوية داخل القناة: لا يستهلك النواة إلا النتيجة.

| الحقل      | الغرض                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| `dm`       | قرار السماح/الإقران/الرفض للرسائل المباشرة وقائمة `allowFrom`                |
| `group`    | سياسة المجموعة، وسماح المسار، وسماح المرسل، وقائمة السماح، ومتطلب الإشارة     |
| `commands` | تفويض الأوامر عبر المفوِّضين المهيئين                                         |
| `mentions` | ما إذا كان اكتشاف الإشارات ممكناً وما إذا تمت الإشارة إلى الوكيل              |

### MessageFacts

| الحقل            | الغرض                                                          |
| ---------------- | -------------------------------------------------------------- |
| `body`           | نص الغلاف النهائي (منسق)                                       |
| `rawBody`        | النص الوارد الخام                                              |
| `bodyForAgent`   | النص الذي يراه الوكيل                                          |
| `commandBody`    | النص المستخدم لتحليل الأوامر                                   |
| `envelopeFrom`   | تسمية المرسل المعروضة مسبقاً للغلاف                            |
| `senderLabel`    | تجاوز اختياري للمرسل المعروض                                   |
| `preview`        | معاينة قصيرة منقحة للسجلات                                     |
| `inboundHistory` | إدخالات السجل الوارد الحديثة عندما تحتفظ القناة بمخزن مؤقت     |

### SupplementalContextFacts

يغطي السياق التكميلي سياق الاقتباس، وإعادة التوجيه، والتمهيد من السلسلة. يطبق النواة سياسة `contextVisibility` المهيأة. لا يوفر محول القناة إلا الحقائق وعلامات `senderAllowed` حتى تبقى سياسة القنوات المتعددة متسقة.

### InboundMediaFacts

الوسائط مصاغة كحقائق. يبقى تنزيل المنصة، والمصادقة، وسياسة SSRF، وقواعد CDN، وفك التشفير محلياً ضمن القناة. يطابق النواة الحقائق إلى `MediaPath` و`MediaUrl` و`MediaType` و`MediaPaths` و`MediaUrls` و`MediaTypes` و`MediaTranscribedIndexes`.

## عقد المحول

بالنسبة إلى `run` الكامل، يكون شكل المحول:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

يعيد `resolveTurn` قيمة `ChannelTurnResolved`، وهي `AssembledChannelTurn` مع نوع قبول اختياري. يؤدي إرجاع `{ admission: { kind: "observeOnly" } }` إلى تشغيل الدورة من دون إنتاج مخرجات مرئية. يظل المحول مالكاً لاستدعاء التسليم الرجعي؛ لكنه يصبح عملية بلا أثر لتلك الدورة.

يعمل `onFinalize` على كل نتيجة، بما في ذلك أخطاء الإرسال. استخدمه لمسح سجل المجموعة المعلق، وإزالة تفاعلات الإقرار، وإيقاف مؤشرات الحالة، وتفريغ الحالة المحلية.

## محول التسليم

لا يستدعي النواة المنصة مباشرة. تمنح القناة النواة `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

يُستدعى `deliver` مرة واحدة لكل جزء رد مخزن مؤقتاً. أثناء ترحيل دورة حياة الرسائل، يكون تسليم دورة القناة المجمعة مملوكاً للقناة افتراضياً: يعني غياب حقل `durable` أن النواة يجب أن يستدعي `deliver` مباشرة ويجب ألا يمررها عبر التسليم الصادر العام. اضبط `durable` فقط بعد تدقيق القناة لإثبات أن مسار الإرسال العام يحافظ على سلوك التسليم القديم، بما في ذلك أهداف الرد/السلسلة، والتعامل مع الوسائط، وذاكرات الرسائل المرسلة/صدى الذات، وتنظيف الحالة، ومعرّفات الرسائل المعادة. تظل `durable: false` صياغة توافقية لعبارة "استخدم الاستدعاء الرجعي المملوك للقناة"، لكن لا ينبغي أن تحتاج القنوات غير المرحّلة إلى إضافتها. أعد معرّفات رسائل المنصة عندما تكون لدى القناة حتى يتمكن المرسل من الحفاظ على مثبتات السلاسل وتعديل الأجزاء اللاحقة؛ كما ينبغي أن تعيد مسارات التسليم الأحدث `receipt` حتى تتمكن الاستعادة، وإنهاء المعاينة، ومنع التكرار من الانتقال بعيداً عن `messageIds`. بالنسبة إلى الدورات المخصصة للمراقبة فقط، أعد `{ visibleReplySent: false }` أو استخدم `createNoopChannelTurnDeliveryAdapter()`.

القنوات التي تستخدم `runPrepared` مع مرسل مملوك بالكامل للقناة لا تملك `ChannelTurnDeliveryAdapter`. هؤلاء المرسلون ليسوا دائمين افتراضياً. ينبغي أن يحافظوا على مسار التسليم المباشر لديهم إلى أن يختاروا صراحةً الانضمام إلى سياق الإرسال الجديد مع هدف كامل، ومحول آمن لإعادة التشغيل، وعقد إيصال، وخطافات آثار جانبية للقناة.

يجب أن تبقى مساعدات التوافق العامة مثل `recordInboundSessionAndDispatchReply` و`dispatchInboundReplyWithBase` ومساعدات الرسائل المباشرة المباشرة محافظة على السلوك أثناء الترحيل. ينبغي ألا تستدعي التسليم الدائم العام قبل استدعاءات `deliver` أو `reply` الرجعية المملوكة للمتصل.

## خيارات التسجيل

تغلف مرحلة التسجيل `recordInboundSession`. يمكن لمعظم القنوات استخدام القيم الافتراضية. تجاوز عبر `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

ينتظر المرسل مرحلة التسجيل. إذا ألقى التسجيل خطأً، يشغل النواة `onPreDispatchFailure` (عند توفيره إلى `runPrepared`) ثم يعيد رمي الخطأ.

## قابلية الرصد

تصدر كل مرحلة حدثاً منظماً عند توفير استدعاء `log` الرجعي:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

المراحل المسجلة: `ingest` و`classify` و`preflight` و`resolve` و`authorize` و`assemble` و`record` و`dispatch` و`finalize`. تجنب تسجيل النصوص الخام؛ استخدم `MessageFacts.preview` للمعاينات القصيرة المنقحة.

## ما يبقى محلياً ضمن القناة

يمتلك النواة التنسيق. لا تزال القناة تمتلك:

- وسائل نقل المنصة (Gateway، وREST، وwebsocket، والاستقصاء، وWebhooks)
- حل الهوية ومطابقة اسم العرض
- الأوامر الأصلية، وأوامر slash، والإكمال التلقائي، والنوافذ، والأزرار، وحالة الصوت
- عرض البطاقات، والنوافذ، والبطاقات التكيفية
- مصادقة الوسائط، وقواعد CDN، والوسائط المشفرة، والنسخ النصي
- واجهات API للتعديل، والتفاعل، والتنقيح، والحضور
- الملء الخلفي وجلب السجل من جانب المنصة
- تدفقات الإقران التي تتطلب تحققاً خاصاً بالمنصة

إذا بدأت قناتان تحتاجان إلى المساعد نفسه لأحد هذه الأمور، فاستخرج مساعد SDK مشتركاً بدلاً من دفعه إلى النواة.

## الاستقرار

`runtime.channel.turn.*` جزء من سطح تشغيل Plugin العام. يمكن الوصول إلى أنواع الحقائق (`SenderFacts` و`ConversationFacts` و`RouteFacts` و`ReplyPlanFacts` و`AccessFacts` و`MessageFacts` و`SupplementalContextFacts` و`InboundMediaFacts`) وأشكال القبول (`ChannelTurnAdmission` و`ChannelEventClass`) عبر `PluginRuntime` من `openclaw/plugin-sdk/core`.

تنطبق قواعد التوافق مع الإصدارات السابقة: حقول الحقائق الجديدة إضافية، ولا يعاد تسمية أنواع القبول، وتبقى أسماء نقاط الدخول مستقرة. يجب أن تمر احتياجات القنوات الجديدة التي تتطلب تغييراً غير إضافي عبر عملية ترحيل SDK الخاص بالـ Plugin.

## ذات صلة

- [إعادة هيكلة دورة حياة الرسائل](/ar/concepts/message-lifecycle-refactor) لدورة حياة الإرسال/الاستقبال/البث المباشر المخطط لها التي ستغلف هذا النواة
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins) لعقد Plugin القناة الأوسع
- [مساعدات تشغيل Plugin](/ar/plugins/sdk-runtime) لأسطح `runtime.*` الأخرى
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture-internals) لخط تحميل البيانات وآليات السجل

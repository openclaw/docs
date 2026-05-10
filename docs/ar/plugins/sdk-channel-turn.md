---
read_when:
    - أنت تبني Plugin قناة وتريد دورة حياة الدور الوارد المشتركة
    - أنت تنقل مراقب قناة بعيدًا عن كود الربط اليدوي للتسجيل/التوجيه.
    - تحتاج إلى فهم مراحل القبول، والاستيعاب، والتصنيف، والفحص المسبق، والحل، والتسجيل، والإرسال، والإنهاء.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- نواة الدور الوارد المشتركة التي تستخدمها Plugins القنوات المضمّنة والتابعة لجهات خارجية لتسجيل دورات الوكيل وتوزيعها وإنهائها
title: نواة دورة القناة
x-i18n:
    generated_at: "2026-05-10T19:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

نواة دورة القناة هي آلة الحالة المشتركة للوارد التي تحوّل حدث منصة مُطبّعًا إلى دورة وكيل. توفّر إضافات القنوات حقائق المنصة واستدعاء التسليم. أما النواة فتملك التنسيق: الاستيعاب، والتصنيف، والفحص المسبق، والحل، والتفويض، والتجميع، والتسجيل، والإرسال، والإنهاء.

استخدم هذا عندما تكون إضافتك ضمن المسار الساخن للرسائل الواردة. بالنسبة للأحداث غير الرسائل (أوامر slash، والنوافذ المنبثقة، وتفاعلات الأزرار، وأحداث دورة الحياة، والتفاعلات، وحالة الصوت)، أبقِها محلية داخل الإضافة. لا تملك النواة إلا الأحداث التي قد تصبح دورة نصية للوكيل.

<Info>
  تُستدعى النواة عبر وقت تشغيل الإضافة المحقون باسم `runtime.channel.turn.*`. يُصدَّر نوع وقت تشغيل الإضافة من `openclaw/plugin-sdk/core`، لذلك يمكن للإضافات الأصلية من جهات خارجية استخدام نقاط الدخول هذه بالطريقة نفسها التي تستخدمها بها إضافات القنوات المضمّنة.
</Info>

## لماذا نواة مشتركة

تكرر إضافات القنوات تدفق الوارد نفسه: التطبيع، والتوجيه، والبوابة، وبناء سياق، وتسجيل بيانات تعريف الجلسة، وإرسال دورة الوكيل، وإنهاء حالة التسليم. من دون نواة مشتركة، يجب تطبيق أي تغيير في بوابة الإشارة، أو الردود المرئية الخاصة بالأدوات فقط، أو بيانات تعريف الجلسة، أو السجل المعلق، أو إنهاء الإرسال على كل قناة على حدة.

تفصل النواة أربعة مفاهيم عمدًا:

- `ConversationFacts`: من أين جاءت الرسالة
- `RouteFacts`: أي وكيل وجلسة يجب أن يعالجاها
- `ReplyPlanFacts`: إلى أين يجب أن تذهب الردود المرئية
- `MessageFacts`: ما النص والسياق التكميلي اللذان يجب أن يراهما الوكيل

تميز رسائل Slack المباشرة، ومواضيع Telegram، وخيوط Matrix، وجلسات مواضيع Feishu بين هذه عمليًا. التعامل معها كمعرّف واحد يسبب انحرافًا بمرور الوقت.

## دورة حياة المراحل

تشغّل النواة خط الأنابيب الثابت نفسه بغض النظر عن القناة:

1. `ingest` -- يحوّل المهايئ حدث منصة خامًا إلى `NormalizedTurnInput`
2. `classify` -- يعلن المهايئ ما إذا كان هذا الحدث يمكنه بدء دورة وكيل
3. `preflight` -- ينفّذ المهايئ إزالة التكرار، وصدى الذات، والإثراء، وإزالة الارتداد، وفك التشفير، والتعبئة المسبقة الجزئية للحقائق
4. `resolve` -- يعيد المهايئ دورة مجمّعة بالكامل (التوجيه، وخطة الرد، والرسالة، والتسليم)
5. `authorize` -- تُطبّق سياسة الرسائل المباشرة، والمجموعات، والإشارات، والأوامر على الحقائق المجمّعة
6. `assemble` -- يُبنى `FinalizedMsgContext` من الحقائق عبر `buildContext`
7. `record` -- تُحفظ بيانات تعريف الجلسة الواردة وآخر توجيه
8. `dispatch` -- تُنفّذ دورة الوكيل عبر مرسل الكتل المخزّن مؤقتًا
9. `finalize` -- يعمل `onFinalize` الخاص بالمهايئ حتى عند حدوث خطأ في الإرسال

تصدر كل مرحلة حدث سجل منظّمًا عند توفير استدعاء `log`. راجع [قابلية الملاحظة](#observability).

## أنواع القبول

لا ترمي النواة استثناءً عندما تُحجب دورة. بل تعيد `ChannelTurnAdmission`:

| النوع          | متى                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | تُقبل الدورة. تعمل دورة الوكيل ويُستخدم مسار الرد المرئي.                                                                   |
| `observeOnly` | تعمل الدورة من البداية إلى النهاية لكن مهايئ التسليم لا يرسل شيئًا مرئيًا. يُستخدم لوكلاء مراقبة البث وتدفقات الوكلاء المتعددة السلبية الأخرى. |
| `handled`     | استُهلك حدث منصة محليًا (دورة حياة، تفاعل، زر، نافذة منبثقة). تتخطى النواة الإرسال.                                           |
| `drop`        | مسار تخطٍّ. اختياريًا، يحافظ `recordHistory: true` على الرسالة في سجل المجموعة المعلق حتى تتوفر لإشارة مستقبلية سياق.                      |

يمكن أن يأتي القبول من `classify` (قال صنف الحدث إنه لا يمكنه بدء دورة)، أو من `preflight` (إزالة تكرار، صدى ذاتي، إشارة مفقودة مع تسجيل السجل)، أو من `resolveTurn` نفسه.

## نقاط الدخول

يعرض وقت التشغيل ثلاث نقاط دخول مفضلة حتى تتمكن المهايئات من الاشتراك بالمستوى الذي يناسب القناة.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

يظل مساعدان أقدمان في وقت التشغيل متاحين للتوافق مع Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

استخدمه عندما تستطيع قناتك التعبير عن تدفق الوارد لديها كـ `ChannelTurnAdapter<TRaw>`. يحتوي المهايئ على استدعاءات لـ `ingest`، و`classify` اختياري، و`preflight` اختياري، و`resolveTurn` إلزامي، و`onFinalize` اختياري.

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

`run` هو الشكل المناسب عندما تحتوي القناة على منطق مهايئ صغير وتستفيد من امتلاك دورة الحياة عبر الخطافات.

### runAssembled

استخدمه عندما تكون القناة قد حلت التوجيه بالفعل، وبنت `FinalizedMsgContext`،
ولا تحتاج إلا إلى ترتيب التسجيل المشترك وخط أنابيب الرد والإرسال والإنهاء.
هذا هو الشكل المفضل لمسارات الوارد المضمنة البسيطة التي كانت ستكرر خلاف ذلك
القالب النمطي لـ `createChannelMessageReplyPipeline(...)` و
`runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

اختر `runAssembled` بدلًا من `runPrepared` عندما يكون سلوك الإرسال الوحيد المملوك للقناة
هو تسليم الحمولة النهائية بالإضافة إلى الكتابة الاختيارية، أو خيارات الرد، أو التسليم الدائم،
أو تسجيل الأخطاء.

### runPrepared

استخدمه عندما تمتلك القناة مرسلًا محليًا معقدًا فيه معاينات، أو إعادة محاولات، أو تعديلات، أو تمهيد خيط يجب أن يبقى مملوكًا للقناة. تظل النواة تسجل الجلسة الواردة قبل الإرسال وتعرض `DispatchedChannelTurnResult` موحدًا.

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

تستخدم القنوات الغنية (Matrix وMattermost وMicrosoft Teams وFeishu وQQ Bot) `runPrepared` لأن مرسلها ينسق سلوكًا خاصًا بالمنصة يجب ألا تتعلمه النواة.

### buildContext

دالة صافية تحوّل حزم الحقائق إلى `FinalizedMsgContext`. استخدمها عندما تنفذ قناتك جزءًا من خط الأنابيب يدويًا لكنها تريد شكل سياق متسقًا.

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

`buildContext` مفيد أيضًا داخل استدعاءات `resolveTurn` عند تجميع دورة لـ `run`.

<Note>
  لا تزال مساعدات SDK المهملة مثل `dispatchInboundReplyWithBase` تجسر عبر مساعد دورة مجمّعة. يجب أن يستخدم كود الإضافة الجديد `run` أو `runPrepared`.
</Note>

## أنواع الحقائق

الحقائق التي تستهلكها النواة من المهايئ لا تعتمد على المنصة. ترجم كائنات المنصة إلى هذه الأشكال قبل تمريرها إلى النواة.

### NormalizedTurnInput

| الحقل             | الغرض                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | معرّف رسالة ثابت يُستخدم لإزالة التكرار والسجلات                                   |
| `timestamp`       | ميلي ثانية epoch اختيارية                                                            |
| `rawText`         | النص كما استُلم من المنصة                                           |
| `textForAgent`    | نص منظف اختياري للوكيل (إزالة الإشارة، تشذيب الكتابة)             |
| `textForCommands` | نص اختياري يُستخدم لتحليل `/command`                                    |
| `raw`             | مرجع تمرير اختياري لاستدعاءات المهايئ التي تحتاج إلى الأصل |

### ChannelEventClass

| الحقل                  | الغرض                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | إذا كانت false تعيد النواة `{ kind: "handled" }`                       |
| `requiresImmediateAck` | تلميح للمهايئات التي تحتاج إلى ACK قبل الإرسال                      |

### SenderFacts

| الحقل          | الغرض                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | معرّف مرسل ثابت في المنصة                                      |
| `name`         | اسم العرض                                                   |
| `username`     | المعرّف إذا كان مختلفًا عن `name`                                 |
| `tag`          | مميز بأسلوب Discord أو وسم منصة                    |
| `roles`        | معرّفات الأدوار، تُستخدم لمطابقة قائمة السماح حسب دور العضو              |
| `isBot`        | True عندما يكون المرسل بوتًا معروفًا (تستخدمه النواة للإسقاط) |
| `isSelf`       | True عندما يكون المرسل هو الوكيل المكوّن نفسه            |
| `displayLabel` | تسمية معروضة مسبقًا لنص المغلف                           |

### ConversationFacts

| الحقل             | الغرض                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, أو `channel`                                      |
| `id`              | معرّف المحادثة المستخدم للتوجيه                                     |
| `label`           | تسمية بشرية للمغلف                                         |
| `spaceId`         | معرّف مساحة خارجي اختياري (مساحة عمل Slack، أو خادم Matrix المنزلي) |
| `parentId`        | معرّف المحادثة الخارجي عندما يكون هذا خيطًا                          |
| `threadId`        | معرّف الخيط عندما تكون هذه الرسالة داخل خيط                       |
| `nativeChannelId` | معرّف القناة الأصلي في المنصة عندما يختلف عن معرّف التوجيه        |
| `routePeer`       | النظير المستخدم لبحث `resolveAgentRoute`                             |

### RouteFacts

| الحقل                   | الغرض                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | الوكيل الذي يجب أن يتولى هذا الدور                         |
| `accountId`             | تجاوز اختياري (قنوات متعددة الحسابات)                 |
| `routeSessionKey`       | مفتاح الجلسة المستخدم للتوجيه                               |
| `dispatchSessionKey`    | مفتاح الجلسة المستخدم عند الإرسال عندما يختلف عن مفتاح التوجيه |
| `persistedSessionKey`   | مفتاح الجلسة المكتوب في بيانات تعريف الجلسة المستمرة          |
| `parentSessionKey`      | الأصل للجلسات المتفرعة/المترابطة                      |
| `modelParentSessionKey` | الأصل من جهة النموذج للجلسات المتفرعة                    |
| `mainSessionKey`        | تثبيت مالك DM الرئيسي للمحادثات المباشرة                 |
| `createIfMissing`       | السماح لخطوة التسجيل بإنشاء صف جلسة مفقود          |

### ReplyPlanFacts

| الحقل                     | الغرض                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | هدف الرد المنطقي المكتوب في السياق `To`          |
| `originatingTo`           | هدف السياق الأصلي (`OriginatingTo`)            |
| `nativeChannelId`         | معرّف القناة الأصلي في المنصة للتسليم                 |
| `replyTarget`             | وجهة الرد المرئي النهائية إذا كانت تختلف عن `to` |
| `deliveryTarget`          | تجاوز تسليم منخفض المستوى                           |
| `replyToId`               | معرّف الرسالة المقتبسة/المثبتة                              |
| `replyToIdFull`           | المعرّف المقتبس بالصيغة الكاملة عندما تكون لدى المنصة الصيغتان          |
| `messageThreadId`         | معرّف السلسلة وقت التسليم                              |
| `threadParentId`          | معرّف الرسالة الأصلية للسلسلة                         |
| `sourceReplyDeliveryMode` | `thread` أو `reply` أو `channel` أو `direct` أو `none`       |

### AccessFacts

يحمل `AccessFacts` القيم المنطقية التي تحتاجها مرحلة التخويل. تبقى مطابقة الهوية في القناة: يستهلك النواة النتيجة فقط.

| الحقل      | الغرض                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | قرار سماح/إقران/رفض DM وقائمة `allowFrom`                       |
| `group`    | سياسة المجموعة، وسماح المسار، وسماح المرسل، وقائمة السماح، ومتطلب الإشارة   |
| `commands` | تخويل الأوامر عبر المخوّلين المكوّنين                       |
| `mentions` | ما إذا كان اكتشاف الإشارات ممكنا وما إذا ذُكر الوكيل |

### MessageFacts

| الحقل            | الغرض                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | نص الظرف النهائي (منسق)                                |
| `rawBody`        | النص الوارد الخام                                               |
| `bodyForAgent`   | النص الذي يراه الوكيل                                            |
| `commandBody`    | النص المستخدم لتحليل الأمر                                  |
| `envelopeFrom`   | تسمية المرسل المعروضة مسبقا للظرف                     |
| `senderLabel`    | تجاوز اختياري للمرسل المعروض                      |
| `preview`        | معاينة قصيرة منقحة للسجلات                                |
| `inboundHistory` | إدخالات السجل الوارد الحديثة عندما تحتفظ القناة بمخزن مؤقت |

### SupplementalContextFacts

يغطي السياق التكميلي سياق الاقتباس، وإعادة التوجيه، وتمهيد السلسلة. يطبق النواة سياسة `contextVisibility` المكوّنة. لا يوفر محول القناة إلا الحقائق وأعلام `senderAllowed` حتى تبقى السياسة عبر القنوات متسقة.

### InboundMediaFacts

تتشكل الوسائط كحقائق. يبقى تنزيل المنصة، والمصادقة، وسياسة SSRF، وقواعد CDN، وفك التشفير محلية للقناة. يربط النواة الحقائق إلى `MediaPath` و`MediaUrl` و`MediaType` و`MediaPaths` و`MediaUrls` و`MediaTypes` و`MediaTranscribedIndexes`.

## عقد المحول

لـ `run` الكامل، يكون شكل المحول:

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

يعيد `resolveTurn` قيمة `ChannelTurnResolved`، وهي `AssembledChannelTurn` مع نوع قبول اختياري. تؤدي إعادة `{ admission: { kind: "observeOnly" } }` إلى تشغيل الدور من دون إنتاج مخرجات مرئية. يظل المحول مالكا لاستدعاء التسليم؛ لكنه يصبح عملية بلا أثر لذلك الدور.

يعمل `onFinalize` على كل نتيجة، بما في ذلك أخطاء الإرسال. استخدمه لمسح سجل المجموعة المعلق، وإزالة تفاعلات الإقرار، وإيقاف مؤشرات الحالة، وتفريغ الحالة المحلية.

## محول التسليم

لا يستدعي النواة المنصة مباشرة. تسلم القناة إلى النواة `ChannelTurnDeliveryAdapter`:

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

يُستدعى `deliver` مرة واحدة لكل جزء رد مخزن مؤقتا. أثناء ترحيل دورة حياة الرسائل، يكون تسليم دور القناة المجمّع مملوكا للقناة افتراضيا: يعني حقل `durable` المحذوف أن النواة يجب أن يستدعي `deliver` مباشرة ويجب ألا يمرر عبر التسليم الصادر العام. عيّن `durable` فقط بعد تدقيق القناة لإثبات أن مسار الإرسال العام يحافظ على سلوك التسليم القديم، بما في ذلك أهداف الرد/السلسلة، ومعالجة الوسائط، وذاكرات الرسائل المرسلة/الصدى الذاتي المؤقتة، وتنظيف الحالة، ومعرّفات الرسائل المعادة. تظل `durable: false` صياغة توافقية لـ "استخدم استدعاء رد الاتصال المملوك للقناة"، لكن القنوات غير المرحّلة يجب ألا تحتاج إلى إضافتها. أعد معرّفات رسائل المنصة عندما تكون لدى القناة حتى يتمكن المرسل من الحفاظ على روابط السلاسل وتحرير الأجزاء اللاحقة؛ يجب أن تعيد مسارات التسليم الأحدث أيضا `receipt` حتى يمكن نقل الاسترداد، وإنهاء المعاينة، ومنع التكرار بعيدا عن `messageIds`. لأدوار المراقبة فقط، أعد `{ visibleReplySent: false }` أو استخدم `createNoopChannelTurnDeliveryAdapter()`.

القنوات التي تستخدم `runPrepared` مع مرسل مملوك بالكامل للقناة لا تملك `ChannelTurnDeliveryAdapter`. لا تكون هذه المرسلات متينة افتراضيا. يجب أن تبقي مسار التسليم المباشر لديها حتى تختار صراحة الدخول إلى سياق الإرسال الجديد مع هدف كامل، ومحول آمن لإعادة التشغيل، وعقد إيصال، وخطافات آثار جانبية للقناة.

يجب أن تبقى مساعدات التوافق العامة مثل `recordInboundSessionAndDispatchReply` و`dispatchInboundReplyWithBase` ومساعدات DM المباشر محافظة على السلوك أثناء الترحيل. يجب ألا تستدعي التسليم المتين العام قبل استدعاءات `deliver` أو `reply` المملوكة للمتصل.

## خيارات التسجيل

تغلف مرحلة التسجيل `recordInboundSession`. يمكن لمعظم القنوات استخدام الإعدادات الافتراضية. تجاوزها عبر `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

ينتظر المرسل مرحلة التسجيل. إذا ألقى التسجيل خطأ، يشغّل النواة `onPreDispatchFailure` (عند توفيره إلى `runPrepared`) ثم يعيد إلقاء الخطأ.

## قابلية الملاحظة

تُصدر كل مرحلة حدثا منظما عند توفير استدعاء `log`:

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

## ما يبقى محليا للقناة

يمتلك النواة التنسيق. لا تزال القناة تمتلك:

- وسائل نقل المنصة (Gateway وREST وwebsocket والاستطلاع وwebhooks)
- حل الهوية ومطابقة اسم العرض
- الأوامر الأصلية، وأوامر slash، والإكمال التلقائي، والنوافذ المنبثقة، والأزرار، وحالة الصوت
- عرض البطاقات، والنوافذ المنبثقة، والبطاقات التكيفية
- مصادقة الوسائط، وقواعد CDN، والوسائط المشفرة، والنسخ
- واجهات API للتحرير، والتفاعل، والتنقيح، والحضور
- الردم وجلب السجل من جهة المنصة
- تدفقات الإقران التي تتطلب تحققا خاصا بالمنصة

إذا بدأت قناتان تحتاجان إلى المساعد نفسه لأحد هذه الأمور، فاستخرج مساعد SDK مشتركا بدلا من دفعه إلى النواة.

## الاستقرار

`runtime.channel.turn.*` جزء من سطح تشغيل Plugin العام. يمكن الوصول إلى أنواع الحقائق (`SenderFacts` و`ConversationFacts` و`RouteFacts` و`ReplyPlanFacts` و`AccessFacts` و`MessageFacts` و`SupplementalContextFacts` و`InboundMediaFacts`) وأشكال القبول (`ChannelTurnAdmission` و`ChannelEventClass`) عبر `PluginRuntime` من `openclaw/plugin-sdk/core`.

تنطبق قواعد التوافق العكسي: حقول الحقائق الجديدة إضافية، ولا يعاد تسمية أنواع القبول، وتبقى أسماء نقاط الدخول مستقرة. احتياجات القنوات الجديدة التي تتطلب تغييرا غير إضافي يجب أن تمر عبر عملية ترحيل Plugin SDK.

## ذو صلة

- [إعادة هيكلة دورة حياة الرسائل](/ar/concepts/message-lifecycle-refactor) لدورة حياة الإرسال/الاستقبال/المباشر المخطط لها التي ستغلف هذا النواة
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins) لعقد Plugin القناة الأوسع
- [مساعدات تشغيل Plugin](/ar/plugins/sdk-runtime) لأسطح `runtime.*` الأخرى
- [داخليات Plugin](/ar/plugins/architecture-internals) لخط أنابيب التحميل وآليات السجل

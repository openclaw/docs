---
read_when:
    - أنت تبني Plugin قناة وتريد دورة حياة الدور الوارد المشتركة
    - أنت ترحّل مراقب قناة بعيدًا عن طبقة ربط التسجيل/الإرسال المصممة يدويًا
    - تحتاج إلى فهم مراحل القبول، والاستيعاب، والتصنيف، والفحص المسبق، والحل، والتسجيل، والإرسال، والإنهاء
sidebarTitle: Channel turn
summary: runtime.channel.turn -- نواة الدور الوارد المشتركة التي تستخدمها Plugins القنوات المضمّنة والتابعة لجهات خارجية لتسجيل دورات الوكيل وإرسالها وإنهائها
title: نواة دور القناة
x-i18n:
    generated_at: "2026-04-30T08:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

تُعد نواة دورة القناة آلة الحالة الواردة المشتركة التي تحوّل حدث منصة مُطبَّعًا إلى دورة وكيل. توفّر Plugins القنوات حقائق المنصة واستدعاء التسليم. تتولى النواة التنسيق: الاستقبال، والتصنيف، والفحص الأولي، والحل، والتفويض، والتجميع، والتسجيل، والإرسال، والإنهاء.

استخدم هذا عندما يكون Plugin الخاص بك ضمن المسار الساخن للرسائل الواردة. بالنسبة للأحداث غير الرسائل (أوامر الشرطة المائلة، والنوافذ الشرطية، وتفاعلات الأزرار، وأحداث دورة الحياة، والتفاعلات، وحالة الصوت)، أبقها محلية داخل Plugin. لا تملك النواة إلا الأحداث التي قد تصبح دورة نصية للوكيل.

<Info>
  يتم الوصول إلى النواة عبر وقت تشغيل Plugin المحقون باسم `runtime.channel.turn.*`. يُصدَّر نوع وقت تشغيل Plugin من `openclaw/plugin-sdk/core`، لذا يمكن لـ Plugins الأصلية التابعة لأطراف ثالثة استخدام نقاط الدخول هذه بالطريقة نفسها التي تستخدمها Plugins القنوات المضمّنة.
</Info>

## لماذا توجد نواة مشتركة

تكرر Plugins القنوات تدفق الوارد نفسه: التطبيع، والتوجيه، والبوابات، وبناء سياق، وتسجيل بيانات تعريف الجلسة، وإرسال دورة الوكيل، وإنهاء حالة التسليم. من دون نواة مشتركة، يجب تطبيق أي تغيير على بوابة الإشارة، أو الردود المرئية المقتصرة على الأدوات، أو بيانات تعريف الجلسة، أو السجل المعلّق، أو إنهاء الإرسال لكل قناة على حدة.

تحافظ النواة عمدًا على فصل أربعة مفاهيم:

- `ConversationFacts`: من أين أتت الرسالة
- `RouteFacts`: أي وكيل وجلسة يجب أن يعالجاها
- `ReplyPlanFacts`: إلى أين يجب أن تذهب الردود المرئية
- `MessageFacts`: ما المتن والسياق التكميلي اللذان يجب أن يراهما الوكيل

تميز رسائل Slack المباشرة، ومواضيع Telegram، وخيوط Matrix، وجلسات مواضيع Feishu بين هذه الأمور عمليًا. التعامل معها كمعرّف واحد يسبب انحرافًا بمرور الوقت.

## دورة حياة المراحل

تشغّل النواة خط الأنابيب الثابت نفسه بغض النظر عن القناة:

1. `ingest` -- يحوّل المحوّل حدث منصة خامًا إلى `NormalizedTurnInput`
2. `classify` -- يصرّح المحوّل بما إذا كان هذا الحدث يمكنه بدء دورة وكيل
3. `preflight` -- ينفّذ المحوّل إزالة التكرار، وصدى الذات، والإثراء، وتأجيل المعالجة، وفك التشفير، والملء المسبق الجزئي للحقائق
4. `resolve` -- يعيد المحوّل دورة مجمّعة بالكامل (المسار، وخطة الرد، والرسالة، والتسليم)
5. `authorize` -- تُطبَّق سياسة الرسائل المباشرة، والمجموعات، والإشارات، والأوامر على الحقائق المجمّعة
6. `assemble` -- يُبنى `FinalizedMsgContext` من الحقائق عبر `buildContext`
7. `record` -- تُحفظ بيانات تعريف الجلسة الواردة وآخر مسار
8. `dispatch` -- تُنفَّذ دورة الوكيل عبر مرسل الكتل المخزّن مؤقتًا
9. `finalize` -- يعمل `onFinalize` الخاص بالمحوّل حتى عند حدوث خطأ في الإرسال

تصدر كل مرحلة حدث سجل منظمًا عند توفير استدعاء `log`. راجع [قابلية الملاحظة](#observability).

## أنواع القبول

لا تطرح النواة خطأ عندما تكون الدورة محجوبة. بل تعيد `ChannelTurnAdmission`:

| النوع          | متى                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | تُقبل الدورة. تعمل دورة الوكيل ويُستخدم مسار الرد المرئي.                                                                   |
| `observeOnly` | تعمل الدورة من البداية إلى النهاية لكن محوّل التسليم لا يرسل شيئًا مرئيًا. يُستخدم لوكلاء مراقبة البث وتدفقات الوكلاء المتعددين السلبية الأخرى. |
| `handled`     | تم استهلاك حدث منصة محليًا (دورة حياة، تفاعل، زر، نافذة شرطية). تتجاوز النواة الإرسال.                                           |
| `drop`        | مسار تخطّي. اختياريًا، يحافظ `recordHistory: true` على الرسالة في سجل المجموعة المعلّق كي تتوفر للذكر المستقبلي سياقًا.                      |

يمكن أن يأتي القبول من `classify` (صرّحت فئة الحدث بأنه لا يمكنه بدء دورة)، أو من `preflight` (إزالة التكرار، وصدى الذات، وذكر مفقود مع تسجيل السجل)، أو من `resolveTurn` نفسه.

## نقاط الدخول

يعرض وقت التشغيل ثلاث نقاط دخول مفضلة كي تتمكن المحوّلات من الاشتراك بالمستوى الذي يطابق القناة.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

يبقى مساعدان أقدم في وقت التشغيل متاحين لتوافق Plugin SDK:

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

`run` هو الشكل المناسب عندما تمتلك القناة منطق محوّل صغيرًا وتستفيد من امتلاك دورة الحياة عبر الخطافات.

### runPrepared

استخدمه عندما تمتلك القناة مرسلًا محليًا معقدًا يتضمن معاينات، وإعادة محاولات، وتعديلات، أو تمهيد خيط يجب أن يبقى مملوكًا للقناة. لا تزال النواة تسجل الجلسة الواردة قبل الإرسال وتعرض `DispatchedChannelTurnResult` موحدًا.

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

تستخدم القنوات الغنية (Matrix، وMattermost، وMicrosoft Teams، وFeishu، وQQ Bot) `runPrepared` لأن مرسلها ينسّق سلوكًا خاصًا بالمنصة يجب ألا تتعلمه النواة.

### buildContext

دالة نقية تربط حزم الحقائق إلى `FinalizedMsgContext`. استخدمها عندما تبني قناتك جزءًا من خط الأنابيب يدويًا لكنها تريد شكل سياق متسقًا.

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

يكون `buildContext` مفيدًا أيضًا داخل استدعاءات `resolveTurn` عند تجميع دورة لـ `run`.

<Note>
  لا تزال مساعدات SDK المتقادمة مثل `dispatchInboundReplyWithBase` تعبر عبر مساعد دورة مجمّعة. يجب أن تستخدم شيفرة Plugin الجديدة `run` أو `runPrepared`.
</Note>

## أنواع الحقائق

الحقائق التي تستهلكها النواة من محوّلك حيادية تجاه المنصة. ترجم كائنات المنصة إلى هذه الأشكال قبل تسليمها إلى النواة.

### NormalizedTurnInput

| الحقل             | الغرض                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | معرّف رسالة ثابت يُستخدم لإزالة التكرار والسجلات                                   |
| `timestamp`       | وقت اختياري بالمللي ثانية منذ الحقبة                                                            |
| `rawText`         | المتن كما استُقبل من المنصة                                           |
| `textForAgent`    | متن منظف اختياري للوكيل (إزالة الإشارة، تقليم الكتابة)             |
| `textForCommands` | متن اختياري يُستخدم لتحليل `/command`                                    |
| `raw`             | مرجع تمرير اختياري لاستدعاءات المحوّل التي تحتاج إلى الأصل |

### ChannelEventClass

| الحقل                  | الغرض                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | إذا كانت false فتعيد النواة `{ kind: "handled" }`                       |
| `requiresImmediateAck` | تلميح للمحوّلات التي تحتاج إلى ACK قبل الإرسال                      |

### SenderFacts

| الحقل          | الغرض                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | معرّف مرسل ثابت على المنصة                                      |
| `name`         | اسم العرض                                                   |
| `username`     | المعرّف إذا كان مختلفًا عن `name`                                 |
| `tag`          | مميّز بنمط Discord أو وسم المنصة                    |
| `roles`        | معرّفات الأدوار، تُستخدم لمطابقة قائمة سماح أدوار الأعضاء              |
| `isBot`        | true عندما يكون المرسل روبوتًا معروفًا (تستخدمها النواة للإسقاط) |
| `isSelf`       | true عندما يكون المرسل هو الوكيل المكوَّن نفسه            |
| `displayLabel` | تسمية معروضة مسبقًا لنص الغلاف                           |

### ConversationFacts

| الحقل             | الغرض                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`، أو `group`، أو `channel`                                      |
| `id`              | معرّف المحادثة المستخدم للتوجيه                                     |
| `label`           | تسمية بشرية للغلاف                                         |
| `spaceId`         | معرّف مساحة خارجي اختياري (مساحة عمل Slack، أو خادم Matrix المنزلي) |
| `parentId`        | معرّف المحادثة الخارجي عندما يكون هذا خيطًا                          |
| `threadId`        | معرّف الخيط عندما تكون هذه الرسالة داخل خيط                       |
| `nativeChannelId` | معرّف القناة الأصلي للمنصة عندما يختلف عن معرّف التوجيه        |
| `routePeer`       | الند المستخدم لبحث `resolveAgentRoute`                             |

### RouteFacts

| الحقل                   | الغرض                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | الوكيل الذي يجب أن يتعامل مع هذه الدورة                         |
| `accountId`             | تجاوز اختياري (القنوات متعددة الحسابات)                 |
| `routeSessionKey`       | مفتاح الجلسة المستخدم للتوجيه                               |
| `dispatchSessionKey`    | مفتاح الجلسة المستخدم عند الإرسال عندما يختلف عن مفتاح المسار |
| `persistedSessionKey`   | مفتاح الجلسة المكتوب إلى بيانات تعريف الجلسة المحفوظة          |
| `parentSessionKey`      | الأصل للجلسات المتفرعة/المترابطة بخيوط                      |
| `modelParentSessionKey` | الأصل من جهة النموذج للجلسات المتفرعة                    |
| `mainSessionKey`        | تثبيت مالك الرسالة المباشرة الرئيسي للمحادثات المباشرة                 |
| `createIfMissing`       | السماح لخطوة التسجيل بإنشاء صف جلسة مفقود          |

### ReplyPlanFacts

| الحقل                     | الغرض                                                   |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | هدف الرد المنطقي المكتوب في السياق `To`                 |
| `originatingTo`           | هدف السياق الأصلي (`OriginatingTo`)                     |
| `nativeChannelId`         | معرّف القناة الأصلي للمنصة المستخدم للتسليم             |
| `replyTarget`             | وجهة الرد المرئية النهائية إذا كانت تختلف عن `to`       |
| `deliveryTarget`          | تجاوز تسليم على مستوى أدنى                              |
| `replyToId`               | معرّف الرسالة المقتبسة/المثبتة                          |
| `replyToIdFull`           | معرّف الاقتباس الكامل عندما تملك المنصة كليهما          |
| `messageThreadId`         | معرّف سلسلة النقاش وقت التسليم                          |
| `threadParentId`          | معرّف الرسالة الأصلية لسلسلة النقاش                     |
| `sourceReplyDeliveryMode` | `thread` أو `reply` أو `channel` أو `direct` أو `none`  |

### AccessFacts

يحمل `AccessFacts` القيم المنطقية التي تحتاجها مرحلة التفويض. يبقى تطابق الهوية داخل القناة: تستهلك النواة النتيجة فقط.

| الحقل      | الغرض                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| `dm`       | قرار السماح/الإقران/الرفض للرسائل المباشرة وقائمة `allowFrom`           |
| `group`    | سياسة المجموعة، والسماح بالمسار، والسماح للمرسل، وقائمة السماح، ومتطلب الذكر |
| `commands` | تفويض الأوامر عبر المفوّضين المكوّنين                                    |
| `mentions` | ما إذا كان اكتشاف الذكر ممكنا وما إذا كان قد تم ذكر الوكيل               |

### MessageFacts

| الحقل            | الغرض                                                        |
| ---------------- | ------------------------------------------------------------ |
| `body`           | نص المغلف النهائي (منسق)                                     |
| `rawBody`        | النص الوارد الخام                                            |
| `bodyForAgent`   | النص الذي يراه الوكيل                                        |
| `commandBody`    | النص المستخدم لتحليل الأوامر                                 |
| `envelopeFrom`   | تسمية المرسل المعروضة مسبقا للمغلف                           |
| `senderLabel`    | تجاوز اختياري للمرسل المعروض                                 |
| `preview`        | معاينة قصيرة منقحة للسجلات                                   |
| `inboundHistory` | إدخالات السجل الوارد الحديثة عندما تحتفظ القناة بمخزن مؤقت   |

### SupplementalContextFacts

يغطي السياق التكميلي سياق الاقتباس وإعادة التوجيه وتمهيد سلسلة النقاش. تطبق النواة سياسة `contextVisibility` المكوّنة. لا يوفر مهايئ القناة إلا الحقائق وأعلام `senderAllowed` حتى تبقى السياسة متسقة عبر القنوات.

### InboundMediaFacts

تكون الوسائط مصاغة كحقائق. يبقى تنزيل المنصة، والمصادقة، وسياسة SSRF، وقواعد CDN، وفك التشفير محلية للقناة. تربط النواة الحقائق إلى `MediaPath` و`MediaUrl` و`MediaType` و`MediaPaths` و`MediaUrls` و`MediaTypes` و`MediaTranscribedIndexes`.

## عقد المهايئ

للتشغيل الكامل `run`، يكون شكل المهايئ:

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

يعيد `resolveTurn` قيمة `ChannelTurnResolved`، وهي `AssembledChannelTurn` مع نوع قبول اختياري. يؤدي إرجاع `{ admission: { kind: "observeOnly" } }` إلى تشغيل الدور من دون إنتاج مخرج مرئي. يظل المهايئ مالكا لاستدعاء التسليم؛ لكنه يصبح مجرد عملية بلا أثر لذلك الدور.

يعمل `onFinalize` على كل نتيجة، بما في ذلك أخطاء الإرسال. استخدمه لمسح سجل المجموعة المعلق، وإزالة تفاعلات الإقرار، وإيقاف مؤشرات الحالة، وتفريغ الحالة المحلية.

## مهايئ التسليم

لا تستدعي النواة المنصة مباشرة. تمرر القناة إلى النواة `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

يستدعى `deliver` مرة واحدة لكل جزء رد مخزن مؤقتا. أعد معرّفات رسائل المنصة عندما تكون متاحة لدى القناة حتى يستطيع المرسل الحفاظ على مثبتات سلسلة النقاش وتحرير الأجزاء اللاحقة. للأدوار الخاصة بالمراقبة فقط، أعد `{ visibleReplySent: false }` أو استخدم `createNoopChannelTurnDeliveryAdapter()`.

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

ينتظر المرسل مرحلة التسجيل. إذا ألقى التسجيل خطأ، تشغل النواة `onPreDispatchFailure` (عند توفيره إلى `runPrepared`) ثم تعيد رمي الخطأ.

## قابلية الملاحظة

تصدر كل مرحلة حدثا منظما عند توفير استدعاء `log`:

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

تملك النواة التنسيق. وتظل القناة تملك:

- وسائل نقل المنصة (Gateway وREST وwebsocket والاستقصاء وwebhooks)
- حل الهوية ومطابقة اسم العرض
- الأوامر الأصلية، وأوامر الشرطة المائلة، والإكمال التلقائي، والنوافذ، والأزرار، وحالة الصوت
- عرض البطاقات والنوافذ والبطاقات التكيفية
- مصادقة الوسائط، وقواعد CDN، والوسائط المشفرة، والتفريغ النصي
- واجهات API للتحرير والتفاعل والتنقيح والحضور
- الملء اللاحق وجلب السجل من جهة المنصة
- تدفقات الإقران التي تتطلب تحققا خاصا بالمنصة

إذا بدأت قناتان تحتاجان إلى المساعد نفسه لأحد هذه الأمور، فاستخرج مساعد SDK مشتركا بدلا من دفعه إلى النواة.

## الاستقرار

يعد `runtime.channel.turn.*` جزءا من سطح وقت تشغيل Plugin العام. يمكن الوصول إلى أنواع الحقائق (`SenderFacts` و`ConversationFacts` و`RouteFacts` و`ReplyPlanFacts` و`AccessFacts` و`MessageFacts` و`SupplementalContextFacts` و`InboundMediaFacts`) وأشكال القبول (`ChannelTurnAdmission` و`ChannelEventClass`) عبر `PluginRuntime` من `openclaw/plugin-sdk/core`.

تنطبق قواعد التوافق مع الإصدارات السابقة: حقول الحقائق الجديدة إضافية، ولا يعاد تسمية أنواع القبول، وتبقى أسماء نقطة الدخول مستقرة. يجب أن تمر احتياجات القنوات الجديدة التي تتطلب تغييرا غير إضافي عبر عملية ترحيل SDK الخاصة بالـ Plugin.

## ذات صلة

- [بناء Plugins للقنوات](/ar/plugins/sdk-channel-plugins) لعقد Plugin القناة الأوسع
- [مساعدات وقت تشغيل Plugin](/ar/plugins/sdk-runtime) لأسطح `runtime.*` الأخرى
- [داخليات Plugin](/ar/plugins/architecture-internals) لخط تحميل التدفق وآليات السجل

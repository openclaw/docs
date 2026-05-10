---
read_when:
    - إعادة هيكلة سلوك الإرسال أو الاستقبال في القناة
    - تغيير نوبة القناة، أو إرسال الردود، أو قائمة الانتظار الصادرة، أو بث المعاينة، أو واجهات API لرسائل SDK الخاص بـPlugin
    - تصميم Plugin قناة جديد يحتاج إلى عمليات إرسال دائمة، وإيصالات استلام، ومعاينات، وتعديلات، أو إعادات محاولة
summary: خطة تصميم لدورة حياة موحدة ودائمة لاستقبال الرسائل وإرسالها ومعاينتها وتحريرها والبث المتدفق
title: إعادة هيكلة دورة حياة الرسائل
x-i18n:
    generated_at: "2026-05-10T19:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

هذه الصفحة هي التصميم المستهدف لاستبدال مساعدات أدوار القنوات والردود المتناثرة
وتوجيه الردود وبث المعاينات والتسليم الصادر بدورة حياة رسائل واحدة ومتينة.

النسخة المختصرة:

- يجب أن تكون البدائيات الأساسية هي **الاستلام** و**الإرسال**، لا **الرد**.
- الرد ليس إلا علاقة على رسالة صادرة.
- الدور هو وسيلة ملائمة لمعالجة الوارد، وليس مالك التسليم.
- يجب أن يكون الإرسال قائمًا على السياق: `begin`، التصيير، المعاينة أو البث، الإرسال النهائي،
  الإيداع، الفشل.
- يجب أن يكون الاستلام قائمًا على السياق أيضًا: التطبيع، إزالة التكرار، التوجيه، التسجيل،
  الإرسال إلى المعالج، إقرار المنصة، الفشل.
- يجب أن تختصر SDK العامة للـ Plugin إلى سطح صغير واحد لرسائل القناة.

## المشكلات

نمت حزمة القنوات الحالية من عدة احتياجات محلية صحيحة:

- تستخدم المحولات الواردة البسيطة `runtime.channel.turn.run`.
- تستخدم المحولات الغنية `runtime.channel.turn.runPrepared`.
- تستخدم المساعدات القديمة `dispatchInboundReplyWithBase`،
  و`recordInboundSessionAndDispatchReply`، ومساعدات حمولات الرد، وتجزئة الردود،
  ومراجع الردود، ومساعدات وقت التشغيل الصادر.
- يعيش بث المعاينة في موجّهات خاصة بكل قناة.
- تجري إضافة متانة التسليم النهائي حول مسارات حمولات الرد الحالية.

يعالج هذا الشكل أخطاء محلية، لكنه يترك OpenClaw بعدد زائد من المفاهيم العامة
وعدد زائد من المواضع التي يمكن أن تنحرف فيها دلالات التسليم.

مشكلة الاعتمادية التي كشفت ذلك هي:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

الثابت المستهدف أوسع من Telegram: بمجرد أن يقرر اللب أن رسالة صادرة مرئية
يجب أن توجد، يجب أن تكون النية متينة قبل محاولة الإرسال عبر المنصة،
ويجب إيداع إيصال المنصة بعد النجاح. يمنح ذلك OpenClaw تعافيًا بضمان مرة واحدة على الأقل.
أما سلوك المرة الواحدة بالضبط فلا يوجد إلا للمحولات التي تستطيع إثبات
الإمكانية الأصلية لعدم التكرار أو مطابقة محاولة ذات نتيجة مجهولة بعد الإرسال
مع حالة المنصة قبل إعادة التشغيل.

هذه هي الحالة النهائية لهذا التفكيك، وليست وصفًا لكل مسار حالي.
أثناء الترحيل، يمكن لمساعدات الصادر الحالية أن تستمر في السقوط إلى إرسال
مباشر عندما تفشل كتابات الطابور بأفضل جهد. لا يكتمل التفكيك إلا عندما
تفشل الإرسالات النهائية المتينة بإغلاق صارم أو تختار صراحة الخروج بسياسة
غير متينة موثقة.

## الأهداف

- دورة حياة أساسية واحدة لكل مسارات استلام رسائل القنوات وإرسالها.
- إرسالات نهائية متينة افتراضيًا في دورة حياة الرسائل الجديدة بعد أن يعلن المحول
  سلوكًا آمنًا لإعادة التشغيل.
- دلالات مشتركة للمعاينة، والتحرير، والبث، والإنهاء، وإعادة المحاولة، والتعافي، والإيصالات.
- سطح صغير لـ SDK الخاصة بالـ Plugin يمكن للـ Plugins التابعة لجهات خارجية تعلمه وصيانته.
- توافق مع مستدعي `channel.turn` الحاليين أثناء الترحيل.
- نقاط توسعة واضحة لإمكانات القنوات الجديدة.
- لا فروع خاصة بالمنصات في اللب.
- لا رسائل قناة لفروق الرموز. يبقى بث القنوات تسليم معاينة رسالة
  أو تحرير أو إلحاق أو كتلة مكتملة.
- بيانات وصفية منظمة صادرة من OpenClaw للمخرجات التشغيلية/النظامية كي لا تدخل
  إخفاقات Gateway المرئية من جديد إلى الغرف المشتركة المفعلة للبوتات كطلبات جديدة.

## غير الأهداف

- عدم إزالة `runtime.channel.turn.*` في المرحلة الأولى.
- عدم إجبار كل قناة على السلوك الأصلي نفسه للنقل.
- عدم تعليم اللب مواضيع Telegram أو البث الأصلي في Slack أو عمليات الحذف في Matrix
  أو بطاقات Feishu أو صوت QQ أو أنشطة Teams.
- عدم نشر كل مساعدات الترحيل الداخلية كواجهة SDK مستقرة.
- عدم جعل إعادة المحاولة تعيد تشغيل عمليات منصة غير قابلة لعدم التكرار بعد اكتمالها.

## النموذج المرجعي

لدى Vercel Chat نموذج ذهني عام جيد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- طرائق المحول مثل `postMessage` و`editMessage` و`deleteMessage`
  و`stream` و`startTyping` وجلب السجل
- محول حالة لإزالة التكرار والأقفال والطوابير والاستمرارية

ينبغي لـ OpenClaw استعارة المفردات، لا نسخ السطح.

ما يحتاجه OpenClaw فوق ذلك النموذج:

- نوايا إرسال صادرة متينة قبل استدعاءات النقل المباشرة.
- سياقات إرسال صريحة مع البدء والإيداع والفشل.
- سياقات استلام تعرف سياسة إقرار المنصة.
- إيصالات تبقى بعد إعادة التشغيل ويمكنها قيادة التحريرات والحذف والتعافي
  وكبت التكرارات.
- SDK عامة أصغر. يمكن للـ Plugins المضمّنة استخدام مساعدات وقت تشغيل داخلية، لكن
  يجب أن ترى Plugins الجهات الخارجية واجهة رسائل واحدة متماسكة.
- سلوك خاص بالوكيل: الجلسات، والنصوص، وبث الكتل، وتقدم الأدوات،
  والموافقات، وتوجيهات الوسائط، والردود الصامتة، وسجل الإشارات في المجموعات.

وعود بأسلوب `thread.post()` ليست كافية لـ OpenClaw. فهي تخفي
حد المعاملة الذي يقرر ما إذا كان الإرسال قابلًا للتعافي.

## نموذج اللب

يجب أن يعيش النطاق الجديد تحت مساحة أسماء داخلية في اللب مثل
`src/channels/message/*`.

لديه أربعة مفاهيم:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

يتولى `receive` دورة حياة الوارد.

يتولى `send` دورة حياة الصادر.

يتولى `live` حالة المعاينة والتحرير والتقدم والبث.

تتولى `state` تخزين النية المتينة، والإيصالات، وعدم التكرار، والتعافي، والأقفال،
وإزالة التكرار.

## مصطلحات الرسائل

### الرسالة

الرسالة المطبّعة محايدة تجاه المنصة:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### الهدف

يصف الهدف مكان وجود الرسالة:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### العلاقة

الرد علاقة، وليس أصلًا للواجهة البرمجية:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

يتيح ذلك لمسار الإرسال نفسه التعامل مع الردود العادية، وإشعارات Cron، ومطالبات الموافقة،
وإكمالات المهام، وإرسالات أداة الرسائل، وإرسالات CLI أو واجهة التحكم، ونتائج الوكلاء الفرعيين،
وإرسالات الأتمتة.

### الأصل

يصف الأصل من أنتج الرسالة وكيف يجب أن يتعامل OpenClaw مع أصداء
تلك الرسالة. وهو منفصل عن العلاقة: يمكن أن تكون الرسالة ردًا على مستخدم
ومع ذلك تكون مخرجات تشغيلية صادرة من OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

يمتلك اللب معنى المخرجات الصادرة من OpenClaw. وتمتلك القنوات كيفية
ترميز ذلك الأصل في نقلها.

أول استخدام مطلوب هو مخرجات فشل Gateway. يجب أن يظل البشر قادرين على رؤية
رسائل مثل "Agent failed before reply" أو "Missing API key"، لكن مخرجات OpenClaw
التشغيلية الموسومة يجب ألا تُقبل كمدخلات مؤلفة بواسطة بوت في الغرف المشتركة
عند تمكين `allowBots`.

### الإيصال

الإيصالات كائنات من الدرجة الأولى:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

الإيصالات هي الجسر من النية المتينة إلى التحرير والحذف وإنهاء المعاينة
وكبت التكرارات والتعافي مستقبلًا.

يمكن أن يصف الإيصال رسالة منصة واحدة أو تسليمًا متعدد الأجزاء. يجب أن يحافظ
النص المجزأ، والوسائط مع النص، والصوت مع النص، وبدائل البطاقات على كل
معرفات المنصة مع الاستمرار في كشف معرف أساسي للتسلسل والتحريرات اللاحقة.

## سياق الاستلام

لا ينبغي أن يكون الاستلام استدعاء مساعد مجردًا. يحتاج اللب إلى سياق يعرف
إزالة التكرار والتوجيه وتسجيل الجلسة وسياسة إقرار المنصة.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

تدفق الاستلام:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

الإقرار ليس شيئًا واحدًا. يجب أن يبقي عقد الاستلام هذه الإشارات منفصلة:

- **إقرار النقل:** يخبر Webhook المنصة أو المقبس بأن OpenClaw قبل
  غلاف الحدث. تتطلب بعض المنصات ذلك قبل الإرسال إلى المعالج.
- **إقرار إزاحة الاستطلاع:** يقدّم مؤشرًا كي لا يُجلب الحدث نفسه
  مرة أخرى. يجب ألا يتقدم هذا بعد عمل لا يمكن التعافي منه.
- **إقرار تسجيل الوارد:** يؤكد أن OpenClaw ثبّت ما يكفي من البيانات الوصفية للوارد
  لإزالة التكرار وتوجيه إعادة التسليم.
- **إيصال مرئي للمستخدم:** سلوك قراءة/حالة/كتابة اختياري؛ ليس أبدًا
  حدًا للمتانة.

يتحكم `ReceiveAckPolicy` فقط في إقرار النقل أو الاستطلاع. يجب
ألا يُعاد استخدامه لإيصالات القراءة أو تفاعلات الحالة.

قبل تفويض البوت، يجب أن يطبق الاستلام سياسة صدى OpenClaw المشتركة
عندما تستطيع القناة فك ترميز بيانات أصل الرسالة الوصفية:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

هذا الإسقاط قائم على الوسم، لا على النص. رسالة غرفة مؤلفة بواسطة بوت لها
نص فشل Gateway المرئي نفسه لكن من دون بيانات وصفية لأصل OpenClaw تظل
تمر عبر تفويض `allowBots` العادي.

سياسة الإقرار صريحة:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

يستخدم استطلاع Telegram الآن سياسة إقرار سياق الاستلام للعلامة المائية
المستمرة لإعادة التشغيل. لا يزال المتتبع يراقب تحديثات grammY أثناء دخولها
سلسلة الوسطاء، لكن OpenClaw لا يثبّت إلا معرف التحديث المكتمل الآمن بعد
الإرسال الناجح إلى المعالج، تاركًا التحديثات الفاشلة أو الأدنى المعلقة قابلة
لإعادة التشغيل بعد إعادة التشغيل. ما تزال إزاحة جلب `getUpdates` العليا في Telegram
تتحكم بها مكتبة الاستطلاع، لذا يبقى الجزء الأعمق المتبقي هو مصدر استطلاع
متين بالكامل إذا احتجنا إلى إعادة تسليم على مستوى المنصة تتجاوز علامة إعادة تشغيل
OpenClaw المائية. قد تحتاج منصات Webhook إلى إقرار HTTP فوري، لكنها لا تزال
تحتاج إلى إزالة تكرار الوارد ونوايا إرسال صادرة متينة لأن Webhooks يمكن أن تعيد التسليم.

## سياق الإرسال

الإرسال قائم على السياق أيضًا:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

التنسيق المفضّل:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

تتوسع الدالة المساعدة إلى:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

يجب أن تكون النية موجودة قبل إدخال/إخراج النقل. يمكن الاسترداد من إعادة تشغيل بعد البدء وقبل
التثبيت.

الحدّ الخطر يكون بعد نجاح المنصة وقبل تثبيت الإيصال. إذا توقفت
العملية هناك، فلا يمكن لـ OpenClaw معرفة ما إذا كانت رسالة المنصة موجودة
ما لم يوفّر المحوّل قدرة أصلية على idempotency أو مسار تسوية للإيصال.
يجب استئناف تلك المحاولات في `unknown_after_send`، لا إعادة تشغيلها عميانيًا. قد تختار القنوات
التي لا تملك تسوية إعادة تشغيل at-least-once فقط إذا كانت الرسائل المرئية المكررة
مقايضة مقبولة وموثقة لتلك القناة والعلاقة.
يتطلب جسر التسوية الحالي في SDK من المحوّل إعلان
`reconcileUnknownSend`، ثم يطلب من `durableFinal.reconcileUnknownSend`
تصنيف إدخال غير معروف على أنه `sent` أو `not_sent` أو `unresolved`؛ وحده `not_sent`
يسمح بإعادة التشغيل، وتبقى الإدخالات غير المحسومة نهائية أو تعيد فقط محاولة
فحص التسوية.

يجب أن تكون سياسة المتانة صريحة:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

يعني `required` أن النواة يجب أن تفشل بإغلاق عندما لا تستطيع كتابة النية الدائمة.
يمكن لـ `best_effort` المتابعة عندما يكون الاستمرار غير متاح. يحافظ `disabled` على
سلوك الإرسال المباشر القديم. أثناء الترحيل، تكون wrappers القديمة ودوال
التوافق العامة افتراضيًا على `disabled`؛ ويجب ألا تستنتج `required` من
حقيقة أن قناة ما لديها محوّل صادر عام.

تملك سياقات الإرسال أيضًا التأثيرات المحلية للقناة بعد الإرسال. لا يكون الترحيل آمنًا
إذا تجاوز التسليم الدائم السلوك المحلي الذي كان مرتبطًا سابقًا
بمسار الإرسال المباشر للقناة. تشمل الأمثلة ذاكرات التخزين المؤقت لمنع صدى الذات،
وعلامات المشاركة في السلاسل، ومراسي التحرير الأصلية، وعرض توقيع النموذج،
وحراس التكرار الخاصين بالمنصة. يجب أن تنتقل تلك التأثيرات إما إلى
محوّل الإرسال، أو محوّل العرض، أو hook مسمّى لسياق الإرسال قبل أن
تتمكن تلك القناة من تمكين التسليم النهائي العام الدائم.

يجب أن تعيد دوال الإرسال المساعدة الإيصالات بالكامل إلى مستدعيها. لا يمكن
لـ wrappers الدائمة ابتلاع معرفات الرسائل أو استبدال نتيجة تسليم القناة بـ
`undefined`؛ تستخدم الموزّعات المخزّنة مؤقتًا تلك المعرفات لمراسي السلاسل، والتحريرات اللاحقة،
وإنهاء المعاينة، ومنع التكرار.

تعمل عمليات الإرسال الاحتياطية على دفعات، لا على حمولات مفردة. يمكن لإعادات كتابة الرد الصامت،
والاحتياط للوسائط، والاحتياط للبطاقات، وإسقاط المقاطع أن تنتج جميعها أكثر من
رسالة واحدة قابلة للتسليم، لذلك يجب على سياق الإرسال إما تسليم كامل
الدفعة المسقطة أو توثيق سبب صلاحية حمولة واحدة فقط صراحة.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

عندما يكون مثل هذا الاحتياط دائمًا، يجب تمثيل الدفعة المسقطة بالكامل بواسطة
نية إرسال دائمة واحدة أو خطة دفعة ذرّية أخرى. تسجيل كل حمولة
واحدة تلو الأخرى ليس كافيًا: يمكن أن يترك التعطل بين الحمولات احتياطًا مرئيًا جزئيًا
بلا سجل دائم للحمولات المتبقية. يجب أن يعرف الاسترداد
أي الوحدات لديها إيصالات بالفعل، وأن يعيد تشغيل الوحدات الناقصة فقط أو يعلّم
الدفعة كـ `unknown_after_send` حتى يسويها المحوّل.

## السياق الحي

ينبغي أن تكون سلوكيات المعاينة، والتحرير، والتقدم، والتدفق دورة حياة واحدة اختيارية التفعيل.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

الحالة الحية دائمة بما يكفي للاسترداد أو منع التكرارات:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

ينبغي أن يغطي هذا السلوك الحالي:

- إرسال Telegram مع تحرير المعاينة، مع نهائي جديد بعد تجاوز المعاينة عمر التقادم.
- إرسال Discord مع تحرير المعاينة، والإلغاء عند الوسائط/الخطأ/الرد الصريح.
- تدفق Slack الأصلي أو معاينة مسودة حسب شكل السلسلة.
- إنهاء منشور مسودة Mattermost.
- إنهاء حدث مسودة Matrix أو التنقيح عند عدم التطابق.
- تدفق تقدم Teams الأصلي.
- تدفق QQ Bot أو احتياط مجمّع.

## سطح المحوّل

يجب أن يكون هدف SDK العام مسارًا فرعيًا واحدًا:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

شكل الهدف:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

مهايئ الإرسال:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

مهايئ الاستقبال:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

قبل التخويل التمهيدي، يجب على النواة تشغيل مسند صدى OpenClaw المشترك
كلما أرجعت `origin.decode` بيانات تعريف منشأها OpenClaw. يزوّد مهايئ الاستقبال
حقائق المنصة مثل كاتب البوت وبنية الغرفة؛ وتملك النواة قرار الإسقاط
والترتيب حتى لا تعيد القنوات تنفيذ مرشحات النصوص.

مهايئ الأصل:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

تضبط النواة `MessageOrigin`. لا تفعل القنوات سوى ترجمته إلى بيانات تعريف النقل
الأصلية ومنها. يربط Slack هذا بـ `chat.postMessage({ metadata })` و
`message.metadata` الواردة؛ ويمكن أن يربطه Matrix بمحتوى حدث إضافي؛ أما القنوات
التي لا تملك بيانات تعريف أصلية فيمكنها استخدام إيصال/سجل صادر عندما يكون ذلك
أفضل تقريب متاح.

الإمكانات:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## تقليل سطح SDK العام

ينبغي أن يستوعب السطح العام الجديد هذه المجالات المفهومية أو يوقفها تدريجياً:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- معظم الاستخدامات العامة لـ `outbound-runtime`
- مساعدات مخصصة لدورة حياة مسودة البث

يمكن أن تبقى المسارات الفرعية للتوافق كأغلفة، لكن لا ينبغي أن تحتاج إليها plugins
الأطراف الثالثة الجديدة.

قد تحتفظ plugins المضمّنة باستيرادات المساعدات الداخلية عبر مسارات وقت تشغيل
فرعية محجوزة أثناء الترحيل. ينبغي أن توجه الوثائق العامة مؤلفي plugins إلى
`plugin-sdk/channel-message` عندما يصبح موجوداً.

## العلاقة بدورة القناة

ينبغي أن يبقى `runtime.channel.turn.*` أثناء الترحيل.

ينبغي أن يصبح مهايئ توافق:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

ينبغي أن يبقى `channel.turn.runPrepared` أيضاً في البداية:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

بعد ربط جميع plugins المضمّنة ومسارات توافق الأطراف الثالثة المعروفة،
يمكن إيقاف `channel.turn` تدريجياً. لا ينبغي إزالته حتى يتوفر مسار ترحيل
SDK منشور واختبارات عقد تثبت أن plugins القديمة ما تزال تعمل أو تفشل
بخطأ إصدار واضح.

## حواجز التوافق

أثناء الترحيل، يكون التسليم الدائم العام اختيارياً لأي قناة يتضمن رد نداء
التسليم الحالي فيها آثاراً جانبية تتجاوز "إرسال هذه الحمولة".

نقاط الدخول القديمة غير دائمة افتراضياً:

- يستخدم `channel.turn.run` و `dispatchAssembledChannelTurn` رد نداء
  التسليم الخاص بالقناة ما لم تزوّد تلك القناة صراحةً كائن سياسة/خيارات دائم
  خاضعاً للتدقيق.
- يبقى `channel.turn.runPrepared` مملوكاً للقناة حتى يستدعي المرسل المجهّز
  سياق الإرسال صراحةً.
- لا تقوم مساعدات التوافق العامة مثل `recordInboundSessionAndDispatchReply`
  و `dispatchInboundReplyWithBase` ومساعدات الرسائل المباشرة مطلقاً بحقن
  تسليم دائم عام قبل رد نداء `deliver` أو `reply` الذي يوفره المستدعي.

بالنسبة إلى أنواع جسور الترحيل، تعني `durable: undefined` "غير دائم". لا يتم
تمكين المسار الدائم إلا بقيمة سياسة/خيارات صريحة. يمكن أن تبقى `durable:
false` كصياغة توافق، لكن ينبغي ألا يتطلب التنفيذ من كل قناة غير مرحّلة إضافتها.

يجب أن تحافظ شيفرة الجسر الحالية على قرار الديمومة صريحاً:

- تُرجع آلية التسليم النهائي الدائم حالةً مميَّزة. `handled_visible` و
  `handled_no_send` نهائيتان؛ وقد تعود `unsupported` و `not_applicable`
  إلى التسليم المملوك للقناة؛ أما `failed` فيمرّر فشل الإرسال.
- يخضع التسليم النهائي الدائم العام لقدرات المحوّل، مثل التسليم الصامت،
  والحفاظ على هدف الرد، والحفاظ على الاقتباس الأصلي، وخطاطيف إرسال
  الرسائل. عند غياب التكافؤ، يجب اختيار التسليم المملوك للقناة، لا إرسال عام
  يغيّر السلوك المرئي للمستخدم.
- تكشف عمليات الإرسال الدائمة المدعومة بالطابور مرجع نية تسليم. يمكن لحقول
  الجلسة الحالية `pendingFinalDelivery*` حمل معرّف النية أثناء الانتقال؛
  والحالة النهائية هي مخزن `MessageSendIntent` بدلاً من نص رد مجمّد مع حقول
  سياق مخصصة.

لا تفعّل المسار الدائم العام لقناة حتى تكون كل هذه الشروط صحيحة:

- ينفّذ محوّل الإرسال العام سلوك العرض والنقل نفسه كما في المسار المباشر
  القديم.
- تُحفَظ الآثار الجانبية المحلية بعد الإرسال عبر سياق الإرسال.
- يُرجع المحوّل إيصالات أو نتائج تسليم تتضمن كل معرّفات رسائل المنصة.
- إما أن تستدعي مسارات المرسل المحضّرة سياق الإرسال الجديد، أو تبقى موثقة
  على أنها خارج ضمان الديمومة.
- يعالج تسليم الرجوع كل حمولة متوقعة، لا الحمولة الأولى فقط.
- يسجّل تسليم الرجوع الدائم مصفوفة الحمولات المتوقعة كاملةً كنية واحدة قابلة
  لإعادة التشغيل أو كخطة دفعة.

مخاطر ترحيل ملموسة يجب الحفاظ عليها:

- يسجّل تسليم مراقب iMessage الرسائل المرسلة في ذاكرة صدى مؤقتة بعد إرسال
  ناجح. يجب أن تستمر الإرسالات النهائية الدائمة في ملء تلك الذاكرة المؤقتة،
  وإلا فقد يعيد OpenClaw ابتلاع ردوده النهائية نفسها كرسائل واردة من المستخدم.
- يضيف Tlon توقيع نموذج اختياريًا ويسجّل سلاسل المحادثات التي شارك فيها بعد
  ردود المجموعات. يجب ألا يتجاوز التسليم الدائم العام تلك الآثار؛ إما انقلها
  إلى محوّلات العرض/الإرسال/الإكمال في Tlon أو أبقِ Tlon على المسار المملوك
  للقناة.
- يملك Discord والمرسلون المحضّرون الآخرون بالفعل سلوك التسليم المباشر
  والمعاينة. ولا يشملهم ضمان الديمومة للدور المجمّع حتى توجّه مرسلاتهم
  المحضّرة النهائيات صراحةً عبر سياق الإرسال.
- يجب أن يسلّم تسليم الرجوع الصامت في Telegram مصفوفة الحمولات المتوقعة كاملة.
  قد يؤدي اختصار الحمولة الواحدة إلى إسقاط حمولات رجوع إضافية بعد الإسقاط.
- قد تكون لدى LINE وZalo وNostr وغيرها من المسارات المجمّعة/المساعدة الحالية
  معالجة لرمز الرد، أو تمرير وسائط عبر وكيل، أو ذاكرات مؤقتة للرسائل المرسلة،
  أو تنظيف للتحميل/الحالة، أو أهداف مخصصة للاستدعاء الخلفي فقط. تبقى هذه على
  التسليم المملوك للقناة حتى تمثل دلالاتها في محوّل الإرسال وتتحقق منها
  الاختبارات.
- قد تملك مساعدات الرسائل المباشرة ردًا عبر استدعاء خلفي يكون هدف النقل الصحيح
  الوحيد. يجب ألا يخمّن الإرسال العام الصادر من `OriginatingTo` أو `To` ويتجاوز
  ذلك الاستدعاء الخلفي.
- يجب أن تبقى مخرجات فشل OpenClaw gateway مرئية للبشر، لكن يجب إسقاط أصداء
  الغرف ذات وسوم مصدر الروبوت قبل تفويض `allowBots`. يجب ألا تنفذ القنوات هذا
  بمرشحات بادئة نصية مرئية إلا كحل طارئ قصير؛ عقد الديمومة هو بيانات وصفية
  منظمة للأصل.

## التخزين الداخلي

يجب أن يخزّن الطابور الدائم نوايا إرسال الرسائل، لا حمولات الرد.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

حلقة الاسترداد:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

يجب أن يحتفظ الطابور بما يكفي من الهوية لإعادة التشغيل عبر الحساب نفسه،
وسلسلة المحادثة نفسها، والهدف نفسه، وسياسة التنسيق نفسها، وقواعد الوسائط نفسها
بعد إعادة التشغيل.

## أصناف الفشل

تصنّف محوّلات القنوات إخفاقات النقل ضمن فئات مغلقة:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

سياسة النواة:

- أعد محاولة `transient` و `rate_limit`.
- لا تعد محاولة `invalid_payload` إلا إذا كان يوجد رجوع للعرض.
- لا تعد محاولة `auth` أو `permission` حتى يتغير الإعداد.
- بالنسبة إلى `not_found`، دع الإكمال الحي يرجع من التحرير إلى إرسال جديد عندما
  تصرّح القناة بأن ذلك آمن.
- بالنسبة إلى `conflict`، استخدم قواعد الإيصال/الإديمبوتنسية لتحديد ما إذا
  كانت الرسالة موجودة بالفعل.
- أي خطأ بعد أن يكون المحوّل ربما أكمل إدخال/إخراج المنصة لكن قبل تثبيت الإيصال
  يصبح `unknown_after_send` ما لم يتمكن المحوّل من إثبات أن عملية المنصة لم تحدث.

## ربط القنوات

| القناة         | الترحيل المستهدف                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | تلقّي سياسة الإقرار مع إرسالات نهائية دائمة. يملك المحوّل المباشر الإرسال ومعاينة التحرير، والإرسال النهائي للمعاينة القديمة، والمواضيع، وتجاوز معاينة الردّ المقتبس، والرجوع الاحتياطي للوسائط، ومعالجة `retry-after`.                                                                                                                                                                   |
| Discord         | يغلّف محوّل الإرسال تسليم الحمولة الدائم الحالي. يملك المحوّل المباشر تحرير المسودة، ومسودة التقدّم، وإلغاء معاينة الوسائط/الأخطاء، والحفاظ على هدف الرد، وإيصالات معرّفات الرسائل. راجع أصداء فشل Gateway التي أنشأها البوت في الغرف المشتركة؛ استخدم سجلًّا صادرًا أو مكافئًا أصليًا آخر إذا كان Discord لا يستطيع حمل بيانات تعريف الأصل في الرسائل العادية. |
| Slack           | يتعامل محوّل الإرسال مع منشورات الدردشة العادية. يختار المحوّل المباشر البث الأصلي عندما يدعم شكل السلسلة ذلك، وإلا يستخدم معاينة مسودة. تحافظ الإيصالات على الطوابع الزمنية للسلسلة. يربط محوّل الأصل حالات فشل Gateway في OpenClaw بـ `chat.postMessage.metadata` في Slack ويسقط أصداء غرف البوت الموسومة قبل تفويض `allowBots`.                                  |
| WhatsApp        | يملك محوّل الإرسال إرسال النص/الوسائط مع نوايا نهائية دائمة. يتعامل محوّل الاستقبال مع ذكر المجموعة وهوية المرسل. يمكن أن يبقى المباشر غائبًا إلى أن يملك WhatsApp نقلًا قابلًا للتحرير.                                                                                                                                                                        |
| Matrix          | يملك المحوّل المباشر تحريرات أحداث المسودة، والإنهاء، والتنقيح، وقيود الوسائط المشفّرة، والرجوع الاحتياطي عند عدم تطابق هدف الرد. يملك محوّل الاستقبال تهيئة الحدث المشفّر وإزالة التكرار. ينبغي لمحوّل الأصل ترميز أصل فشل Gateway في OpenClaw داخل محتوى حدث Matrix وإسقاط أصداء غرفة البوت المكوّنة قبل معالجة `allowBots`.              |
| Mattermost      | يملك المحوّل المباشر منشور مسودة واحدًا، وطيّ التقدّم/الأدوات، والإنهاء في المكان، والرجوع الاحتياطي إلى إرسال جديد.                                                                                                                                                                                                                                                       |
| Microsoft Teams | يملك المحوّل المباشر التقدّم الأصلي وسلوك بث الكتل. يملك محوّل الإرسال الأنشطة وإيصالات المرفقات/البطاقات.                                                                                                                                                                                                                                        |
| Feishu          | يملك محوّل العرض تصيير النص/البطاقات/المحتوى الخام. يملك المحوّل المباشر بطاقات البث ومنع التكرار النهائي. يملك محوّل الإرسال التعليقات، وجلسات المواضيع، والوسائط، ومنع الصوت.                                                                                                                                                                      |
| QQ Bot          | يملك المحوّل المباشر بث C2C، ومهلة المجمّع، والإرسال النهائي الاحتياطي. يملك محوّل العرض وسوم الوسائط وتحويل النص إلى صوت.                                                                                                                                                                                                                               |
| Signal          | استقبال بسيط مع محوّل إرسال. لا محوّل مباشر ما لم يضف signal-cli دعم تحرير موثوقًا.                                                                                                                                                                                                                                                                |
| iMessage        | استقبال بسيط مع محوّل إرسال. يجب أن يحافظ إرسال iMessage على ملء ذاكرة صدى المراقبة المؤقتة قبل أن تتمكن النهائيات الدائمة من تجاوز تسليم المراقبة.                                                                                                                                                                                                                 |
| Google Chat     | استقبال بسيط مع محوّل إرسال، مع ربط علاقة السلسلة بالمساحات ومعرّفات السلاسل. راجع سلوك غرفة `allowBots=true` لأصداء فشل Gateway في OpenClaw الموسومة.                                                                                                                                                                                        |
| LINE            | استقبال بسيط مع محوّل إرسال، مع نمذجة قيود رمز الرد كقدرة هدف/علاقة.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | جسر استقبال SDK مع محوّل إرسال.                                                                                                                                                                                                                                                                                                                          |
| IRC             | استقبال بسيط مع محوّل إرسال، من دون إيصالات تحرير دائمة.                                                                                                                                                                                                                                                                                                    |
| Nostr           | محوّل استقبال وإرسال للرسائل المباشرة المشفّرة؛ الإيصالات هي معرّفات أحداث.                                                                                                                                                                                                                                                                                           |
| QA Channel      | محوّل اختبار عقود لسلوك الاستقبال، والإرسال، والبث المباشر، وإعادة المحاولة، والاسترداد.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | استقبال بسيط مع محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | يجب أن يحافظ محوّل الإرسال على تصيير توقيع النموذج وتتبع السلاسل المُشارَك فيها قبل تفعيل التسليم النهائي الدائم العام.                                                                                                                                                                                                                        |
| Twitch          | استقبال بسيط مع محوّل إرسال وتصنيف حدود المعدّل.                                                                                                                                                                                                                                                                                               |
| Zalo            | استقبال بسيط مع محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | استقبال بسيط مع محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |

## خطة الترحيل

### المرحلة 1: نطاق الرسائل الداخلي

- أضف أنواع `src/channels/message/*` للرسائل، والأهداف، والعلاقات،
  والأصول، والإيصالات، والقدرات، والنوايا الدائمة، وسياق الاستقبال، وسياق الإرسال،
  والسياق المباشر، وفئات الفشل.
- أضف `origin?: MessageOrigin` إلى نوع حمولة جسر الترحيل المستخدم في
  تسليم الرد الحالي، ثم انقل ذلك الحقل إلى `ChannelMessage` وأنواع
  الرسائل المعروضة عندما يستبدل إعادة الهيكلة حمولات الرد.
- أبقِ هذا داخليًا إلى أن تثبت المحوّلات والاختبارات الشكل.
- أضف اختبارات وحدة صِرفة لانتقالات الحالة والتسلسل.

### المرحلة 2: نواة الإرسال الدائم

- انقل صفّ الصادر الحالي من ديمومة حمولة الرد إلى نوايا
  إرسال الرسائل الدائمة.
- اسمح لنوايا الإرسال الدائم بحمل مصفوفة حمولات مُسقطة أو خطة دفعات، وليس
  حمولة رد واحدة فقط.
- حافظ على سلوك استرداد الصف الحالي عبر تحويل التوافق.
- اجعل `deliverOutboundPayloads` يستدعي `messages.send`.
- اجعل ديمومة الإرسال النهائي هي الافتراضي، وافشل بإغلاق عندما لا يمكن
  كتابة النية الدائمة في دورة حياة الرسالة الجديدة، بعد أن يعلن المحوّل
  سلامة إعادة التشغيل. تبقى مسارات توافق دورة القناة وSDK إرسالًا مباشرًا
  افتراضيًا خلال هذه المرحلة.
- سجّل الإيصالات باتساق.
- أعد الإيصالات ونتائج التسليم إلى مستدعي المرسل الأصلي بدلًا من التعامل
  مع الإرسال الدائم كأثر جانبي نهائي.
- استمر في حفظ أصل الرسالة عبر نوايا الإرسال الدائم لكي يحافظ الاسترداد،
  وإعادة التشغيل، والإرسالات المجزأة على المنشأ التشغيلي لـ OpenClaw.

### المرحلة 3: جسر دورة القناة

- أعد تنفيذ `channel.turn.run` و`dispatchAssembledChannelTurn` فوق
  `messages.receive` و`messages.send`.
- أبقِ أنواع الحقائق الحالية مستقرة.
- حافظ على السلوك القديم افتراضيًا. لا تصبح قناة الدورة المجمّعة دائمة
  إلا عندما يختار محوّلها ذلك صراحةً بسياسة ديمومة آمنة لإعادة التشغيل.
- أبقِ `durable: false` كمهرب توافق للمسارات التي تنهي
  التحريرات الأصلية ولا تستطيع إعادة التشغيل بأمان بعد، لكن لا تعتمد على علامات `false`
  لحماية القنوات غير المرحّلة.
- اجعل ديمومة الدورة المجمّعة افتراضية فقط في دورة حياة الرسالة الجديدة، بعد
  أن يثبت ربط القناة أن مسار الإرسال العام يحافظ على دلالات تسليم القناة القديمة.

### المرحلة 4: جسر المرسل المُحضّر

- استبدل `deliverDurableInboundReplyPayload` بجسر سياق إرسال.
- أبقِ المساعد القديم كغلاف.
- انقل Telegram وWhatsApp وSlack وSignal وiMessage وDiscord أولاً لأنها
  تملك بالفعل عملاً نهائياً دائماً أو مسارات إرسال أبسط.
- عامل كل موزّع مُحضّر على أنه غير مغطى حتى يختار صراحةً الدخول في
  سياق الإرسال. يجب أن تقول الوثائق وإدخالات سجل التغييرات "أدوار قناة مجمّعة"
  أو تسمي مسارات القنوات المنقولة بدلاً من ادعاء كل الردود النهائية
  التلقائية.
- حافظ على سلوك `recordInboundSessionAndDispatchReply` ومساعدات الرسائل
  المباشرة Direct-DM ومساعدات التوافق العامة المشابهة كما هو. يمكنها لاحقاً كشف
  اختيار صريح للدخول في سياق الإرسال، لكنها يجب ألا تحاول تلقائياً تنفيذ تسليم
  دائم عام قبل استدعاء التسليم المملوك للمتصل.

### المرحلة 5: دورة حياة مباشرة موحدة

- ابنِ `messages.live` بمحوّلي إثبات:
  - Telegram للإرسال مع التحرير مع إرسال نهائي قديم.
  - Matrix لإنهاء المسودة مع احتياط التنقيح.
- ثم انقل Discord وSlack وMattermost وTeams وQQ Bot وFeishu.
- احذف كود إنهاء المعاينة المكرر فقط بعد أن تملك كل قناة
  اختبارات تكافؤ.

### المرحلة 6: SDK عام

- أضف `openclaw/plugin-sdk/channel-message`.
- وثّقه بصفته واجهة API المفضلة لـ Plugin القناة.
- حدّث تصديرات الحزمة، وجرد نقاط الدخول، وخطوط أساس API المولّدة، ووثائق
  SDK الخاص بـ Plugin.
- أدرج `MessageOrigin`، وخطافات ترميز/فك ترميز الأصل، والمسند المشترك
  `shouldDropOpenClawEcho` في سطح SDK الخاص برسائل القناة.
- أبقِ أغلفة التوافق للمسارات الفرعية القديمة.
- علّم مساعدات SDK المسماة بالرد كمهملة في الوثائق بعد نقل Plugin المضمّنة.

### المرحلة 7: كل المرسلين

انقل كل منتجي الخروج غير المرتبطين بالرد إلى `messages.send`:

- إشعارات cron وheartbeat
- إكمالات المهام
- نتائج الخطافات
- مطالبات الموافقة ونتائج الموافقة
- إرسالات أداة الرسائل
- إعلانات إكمال الوكلاء الفرعيين
- إرسالات CLI أو واجهة التحكم الصريحة
- مسارات الأتمتة/البث

هنا يتوقف النموذج عن كونه "ردود الوكيل" ويصبح "يرسل OpenClaw
رسائل".

### المرحلة 8: إهمال Turn

- أبقِ `channel.turn` كغلاف لنافذة توافق واحدة على الأقل.
- انشر ملاحظات الهجرة.
- شغّل اختبارات توافق SDK الخاص بـ Plugin ضد الاستيرادات القديمة.
- أزل أو أخفِ المساعدات الداخلية القديمة فقط بعد ألا يحتاج إليها أي Plugin مضمّن
  وبعد أن تملك عقود الجهات الخارجية بديلاً مستقراً.

## خطة الاختبار

اختبارات الوحدة:

- تسلسل نية الإرسال الدائم واستعادتها.
- إعادة استخدام مفتاح idempotency وقمع التكرارات.
- تثبيت الإيصال وتخطي الإعادة.
- استعادة `unknown_after_send` التي توفق قبل الإعادة عندما يدعم محوّل
  التوفيق.
- سياسة تصنيف الفشل.
- تسلسل سياسة إقرار الاستلام.
- ربط العلاقات لإرسالات الرد والمتابعة والنظام والبث.
- مصنع أصل فشل Gateway والمسند `shouldDropOpenClawEcho`.
- حفظ الأصل عبر تطبيع الحمولة، والتقسيم إلى أجزاء، وتسلسل الطابور الدائم،
  والاستعادة.

اختبارات التكامل:

- محوّل `channel.turn.run` البسيط لا يزال يسجل ويرسل.
- تسليم الدور المجمّع القديم لا يصبح دائماً إلا إذا اختارت القناة ذلك
  صراحةً.
- جسر `channel.turn.runPrepared` لا يزال يسجل وينهي.
- مساعدات التوافق العامة تستدعي استدعاءات التسليم المملوكة للمتصل افتراضياً
  ولا ترسل إرسالاً عاماً قبل تلك الاستدعاءات.
- تسليم الاحتياط الدائم يعيد تشغيل مصفوفة الحمولة المتوقعة بالكامل بعد
  إعادة التشغيل ولا يمكنه ترك الحمولات اللاحقة غير مسجلة بعد تعطل مبكر.
- تسليم الدور المجمّع الدائم يعيد معرّفات رسائل المنصة إلى الموزّع المخزن
  مؤقتاً.
- خطافات التسليم المخصصة لا تزال تعيد معرّفات رسائل المنصة عندما يكون التسليم
  الدائم معطلاً أو غير متاح.
- الرد النهائي ينجو من إعادة التشغيل بين إكمال المساعد وإرسال المنصة.
- مسودة المعاينة تنتهي في موضعها عندما يكون ذلك مسموحاً.
- تلغى مسودة المعاينة أو تنقح عندما يتطلب عدم تطابق الوسائط/الخطأ/هدف الرد
  تسليماً عادياً.
- البث الكتلي وبث المعاينة لا يسلّمان النص نفسه معاً.
- الوسائط التي بُثت مبكراً لا تتكرر في التسليم النهائي.

اختبارات القنوات:

- رد موضوع Telegram مع إقرار polling مؤجل حتى علامة الاكتمال الآمنة لسياق
  الاستلام.
- استعادة polling في Telegram للتحديثات المقبولة لكن غير المسلّمة مغطاة
  بنموذج الإزاحة الآمنة المكتملة المحفوظ.
- معاينة Telegram القديمة ترسل نهائياً جديداً وتنظف المعاينة.
- احتياط Telegram الصامت يرسل كل حمولة احتياط متوقعة.
- متانة احتياط Telegram الصامت تسجل مصفوفة الاحتياط المتوقعة بالكامل
  ذرياً، لا نية دائمة مفردة الحمولة واحدة لكل دورة تكرار.
- إلغاء معاينة Discord عند الوسائط/الخطأ/الرد الصريح.
- نهائيات موزّع Discord المحضّر تمر عبر سياق الإرسال قبل أن تدعي الوثائق
  أو سجل التغييرات متانة الرد النهائي في Discord.
- إرسالات iMessage النهائية الدائمة تملأ ذاكرة صدى الرسائل المرسلة للمراقب.
- لا تتجاوز مسارات التسليم القديمة في LINE وZalo وNostr بواسطة
  الإرسال الدائم العام حتى توجد اختبارات تكافؤ محوّلاتها.
- يظل تسليم استدعاء Direct-DM/Nostr مرجعياً ما لم يُنقل صراحةً إلى
  هدف رسالة كامل ومحوّل إرسال آمن للإعادة.
- رسائل فشل Gateway الموسومة من OpenClaw في Slack تظل مرئية صادرة،
  وأصداء غرفة الروبوت الموسومة تسقط قبل `allowBots`، ورسائل الروبوت غير
  الموسومة ذات النص المرئي نفسه لا تزال تتبع تفويض الروبوت العادي.
- احتياط البث الأصلي في Slack إلى معاينة مسودة في الرسائل المباشرة ذات
  المستوى الأعلى.
- إنهاء معاينة Matrix واحتياط التنقيح.
- أصداء غرف فشل Gateway الموسومة من OpenClaw في Matrix، من حسابات الروبوت
  المهيأة، تسقط قبل معالجة `allowBots`.
- تدقيقات تسلسل فشل Gateway للغرف المشتركة في Discord وGoogle Chat تغطي
  أوضاع `allowBots` قبل ادعاء الحماية العامة هناك.
- إنهاء مسودة Mattermost واحتياط الإرسال الجديد.
- إنهاء التقدم الأصلي في Teams.
- قمع النهائي المكرر في Feishu.
- احتياط مهلة مجمّع QQ Bot.
- إرسالات Tlon النهائية الدائمة تحفظ عرض توقيع النموذج وتتبع الخيط
  المشارك فيه.
- إرسالات نهائية دائمة بسيطة في WhatsApp وSignal وiMessage وGoogle Chat وLINE وIRC وNostr وNextcloud Talk
  وSynology Chat وTlon وTwitch وZalo وZalo Personal.

التحقق:

- ملفات Vitest المستهدفة أثناء التطوير.
- `pnpm check:changed` في Testbox للسطح الكامل المتغير.
- `pnpm check` أوسع في Testbox قبل إنزال إعادة الهيكلة الكاملة أو بعد
  تغييرات SDK/التصدير العامة.
- فحص دخاني حي أو qa-channel لقناة واحدة على الأقل قابلة للتحرير وقناة
  واحدة بسيطة للإرسال فقط قبل إزالة أغلفة التوافق.

## أسئلة مفتوحة

- ما إذا كان ينبغي لـ Telegram في النهاية استبدال مصدر مشغّل grammY بمصدر
  polling دائم بالكامل يمكنه التحكم في إعادة التسليم على مستوى المنصة، لا
  مجرد علامة إعادة التشغيل المحفوظة في OpenClaw.
- ما إذا كان ينبغي تخزين حالة المعاينة المباشرة الدائمة في سجل الطابور نفسه
  مثل نية الإرسال النهائي أو في مخزن حالة مباشرة شقيق.
- مدة بقاء أغلفة التوافق موثقة بعد شحن `plugin-sdk/channel-message`.
- ما إذا كان ينبغي لـ Plugin الجهات الخارجية تنفيذ محوّلات الاستلام مباشرة
  أو توفير خطافات التطبيع/الإرسال/المباشر فقط عبر `defineChannelMessageAdapter`.
- أي حقول الإيصال آمنة للكشف في SDK العام مقابل حالة وقت التشغيل الداخلية.
- ما إذا كان ينبغي نمذجة الآثار الجانبية مثل ذاكرات صدى الذات وعلامات الخيوط
  المشارك فيها كخطافات سياق إرسال، أو خطوات إنهاء مملوكة للمحوّل، أو مشتركي
  إيصالات.
- أي القنوات لديها بيانات وصفية أصلية للأصل، وأيها يحتاج إلى سجلات خروج
  محفوظة، وأيها لا يمكنه تقديم قمع صدى موثوق عبر الروبوتات.

## معايير القبول

- كل قناة رسائل مضمّنة ترسل الخرج المرئي النهائي عبر `messages.send`.
- كل قناة رسائل واردة تدخل عبر `messages.receive` أو غلاف توافق موثق.
- كل قناة معاينة/تحرير/بث تستخدم `messages.live` لحالة المسودة والإنهاء.
- `channel.turn` مجرد غلاف.
- مساعدات SDK المسماة بالرد هي تصديرات توافق، لا المسار الموصى به.
- الاستعادة الدائمة يمكنها إعادة تشغيل الإرسالات النهائية المعلقة بعد إعادة
  التشغيل بدون فقدان الرد النهائي أو تكرار الإرسالات المثبتة بالفعل؛ الإرسالات
  التي تكون نتيجة منصتها غير معروفة تُوفق قبل الإعادة أو توثق كإرسال مرة واحدة
  على الأقل لذلك المحوّل.
- الإرسالات النهائية الدائمة تفشل مغلقة عندما لا يمكن كتابة النية الدائمة،
  إلا إذا اختار متصل صراحةً وضعاً غير دائم موثقاً.
- مساعدات توافق قناة الدور وSDK القديمة تفترض التسليم المباشر المملوك للقناة؛
  الإرسال الدائم العام اختيار صريح فقط.
- الإيصالات تحفظ كل معرّفات رسائل المنصة للتسليمات متعددة الأجزاء ومعرّفاً
  أولياً لسهولة الخيوط/التحرير.
- الأغلفة الدائمة تحفظ الآثار الجانبية المحلية للقناة قبل استبدال استدعاءات
  التسليم المباشر.
- لا تُعدّ الموزّعات المحضّرة دائمة حتى يستخدم مسار تسليمها النهائي سياق
  الإرسال صراحةً.
- تسليم الاحتياط يعالج كل حمولة متوقعة.
- تسليم الاحتياط الدائم يسجل كل حمولة متوقعة في نية واحدة قابلة للإعادة أو
  خطة دفعة واحدة.
- خرج فشل Gateway الصادر من OpenClaw مرئي للبشر، لكن أصداء الغرف المؤلفة
  بواسطة الروبوت والموسومة تسقط قبل تفويض الروبوت في القنوات التي تعلن دعمها
  لعقد الأصل.
- تشرح الوثائق الإرسال، والاستلام، والمباشر، والحالة، والإيصالات، والعلاقات،
  وسياسة الفشل، والهجرة، وتغطية الاختبار.

## ذو صلة

- [الرسائل](/ar/concepts/messages)
- [البث والتقسيم إلى أجزاء](/ar/concepts/streaming)
- [مسودات التقدم](/ar/concepts/progress-drafts)
- [سياسة إعادة المحاولة](/ar/concepts/retry)
- [نواة دور القناة](/ar/plugins/sdk-channel-turn)

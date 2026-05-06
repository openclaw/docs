---
read_when:
    - إعادة هيكلة سلوك الإرسال أو الاستقبال في القناة
    - تغيير دور القناة أو إرسال الردود أو قائمة الانتظار الصادرة أو بث المعاينة أو واجهات برمجة تطبيقات رسائل SDK الخاص بـ Plugin
    - تصميم Plugin قناة جديد يحتاج إلى عمليات إرسال دائمة أو إيصالات استلام أو معاينات أو تعديلات أو إعادة محاولات
summary: خطة تصميم لدورة الحياة الموحّدة والدائمة لاستقبال الرسائل وإرسالها ومعاينتها وتحريرها وبثّها
title: إعادة هيكلة دورة حياة الرسائل
x-i18n:
    generated_at: "2026-05-06T07:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

هذه الصفحة هي التصميم المستهدف لاستبدال مساعدات أدوار القنوات، وإرسال الردود، وبث المعاينات، والتسليم الصادر المتناثرة بدورة حياة واحدة ودائمة للرسائل.

الخلاصة المختصرة:

- يجب أن تكون البدائيات الأساسية هي **الاستلام** و**الإرسال**، لا **الرد**.
- الرد ليس إلا علاقة في رسالة صادرة.
- الدور هو وسيلة ملائمة لمعالجة الوارد، وليس مالك التسليم.
- يجب أن يستند الإرسال إلى السياق: `begin`، التصيير، المعاينة أو البث، الإرسال النهائي،
  التثبيت، الفشل.
- يجب أن يستند الاستلام إلى السياق أيضًا: التطبيع، إزالة التكرار، التوجيه، التسجيل،
  الإرسال، إقرار المنصة، الفشل.
- يجب أن ينحصر SDK العام لـ Plugin في سطح صغير واحد لرسائل القنوات.

## المشكلات

نما مكدس القنوات الحالي من عدة احتياجات محلية صحيحة:

- تستخدم محولات الوارد البسيطة `runtime.channel.turn.run`.
- تستخدم المحولات الغنية `runtime.channel.turn.runPrepared`.
- تستخدم المساعدات القديمة `dispatchInboundReplyWithBase`،
  و`recordInboundSessionAndDispatchReply`، ومساعدات حمولات الرد، وتجزئة الردود،
  ومراجع الرد، ومساعدات وقت التشغيل الصادر.
- يعيش بث المعاينات في موزعات خاصة بالقنوات.
- تجري إضافة متانة التسليم النهائي حول مسارات حمولات الرد الحالية.

يعالج هذا الشكل أخطاء محلية، لكنه يترك OpenClaw بعدد زائد من المفاهيم العامة
وعدد زائد من المواضع التي يمكن أن تنحرف فيها دلالات التسليم.

مشكلة الموثوقية التي كشفت ذلك هي:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

الثابت المستهدف أوسع من Telegram: بمجرد أن يقرر الجوهر أن رسالة صادرة مرئية
يجب أن توجد، يجب أن تكون النية دائمة قبل محاولة الإرسال عبر المنصة، ويجب تثبيت
إيصال المنصة بعد النجاح. يمنح ذلك OpenClaw استردادًا مرة واحدة على الأقل.
ولا يوجد سلوك مرة واحدة بالضبط إلا للمحولات التي يمكنها إثبات انعدام التكرار
الأصلي أو مطابقة محاولة غير معروفة بعد الإرسال مع حالة المنصة قبل إعادة التشغيل.

هذه هي الحالة النهائية لهذا التحسين، وليست وصفًا لكل مسار حالي. أثناء الترحيل،
لا يزال بإمكان مساعدات الصادر الحالية الرجوع إلى إرسال مباشر عند فشل كتابات
الطابور بأفضل جهد. لا يكتمل التحسين إلا عندما تفشل الإرسالات النهائية الدائمة
بشكل مغلق أو تختار الخروج صراحة بسياسة غير دائمة موثقة.

## الأهداف

- دورة حياة أساسية واحدة لكل مسارات استلام وإرسال رسائل القنوات.
- إرسالات نهائية دائمة افتراضيًا في دورة حياة الرسائل الجديدة بعد أن يعلن المحول
  عن سلوك آمن لإعادة التشغيل.
- دلالات مشتركة للمعاينة، والتعديل، والبث، والإنهاء، وإعادة المحاولة، والاسترداد،
  والإيصال.
- سطح SDK صغير لـ Plugin يمكن لـ Plugins التابعة لجهات خارجية تعلمه وصيانته.
- توافق مع مستدعي `channel.turn` الحاليين أثناء الترحيل.
- نقاط توسيع واضحة لقدرات القنوات الجديدة.
- لا توجد تفريعات خاصة بمنصة في الجوهر.
- لا توجد رسائل قناة بفروق الرموز. يبقى بث القنوات تسليمًا عبر معاينة الرسائل،
  أو تعديلها، أو إلحاقها، أو كتلة مكتملة.
- بيانات وصفية منظمة ذات منشأ من OpenClaw للمخرجات التشغيلية/النظامية حتى لا
  تعود إخفاقات Gateway المرئية إلى الغرف المشتركة المفعلة للبوتات كمطالبات جديدة.

## غير الأهداف

- عدم إزالة `runtime.channel.turn.*` في المرحلة الأولى.
- عدم إجبار كل قناة على السلوك الأصلي نفسه للنقل.
- عدم تعليم الجوهر مواضيع Telegram، أو بثوث Slack الأصلية، أو حذوفات Matrix،
  أو بطاقات Feishu، أو صوت QQ، أو أنشطة Teams.
- عدم نشر كل مساعدات الترحيل الداخلية كواجهة API مستقرة في SDK.
- عدم جعل إعادات المحاولة تعيد تشغيل عمليات منصة مكتملة وغير عديمة التكرار.

## النموذج المرجعي

لدى Vercel Chat نموذج ذهني عام جيد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- أساليب محول مثل `postMessage` و`editMessage` و`deleteMessage`،
  و`stream` و`startTyping`، وجلب السجل
- محول حالة لإزالة التكرار، والأقفال، والطوابير، والاستمرارية

يجب أن يستعير OpenClaw المفردات، لا أن ينسخ السطح.

ما يحتاجه OpenClaw فوق ذلك النموذج:

- نوايا إرسال صادرة دائمة قبل استدعاءات النقل المباشر.
- سياقات إرسال صريحة تتضمن البدء، والتثبيت، والفشل.
- سياقات استلام تعرف سياسة إقرار المنصة.
- إيصالات تبقى بعد إعادة التشغيل ويمكنها دفع التعديلات، والحذف، والاسترداد،
  وكبح التكرارات.
- SDK عام أصغر. يمكن لـ Plugins المضمنة استخدام مساعدات وقت التشغيل الداخلية،
  لكن يجب أن ترى Plugins التابعة لجهات خارجية واجهة API متماسكة واحدة للرسائل.
- سلوك خاص بالوكيل: الجلسات، والنصوص، وبث الكتل، وتقدم الأدوات، والموافقات،
  وتوجيهات الوسائط، والردود الصامتة، وسجل إشارات المجموعات.

لا تكفي وعود بأسلوب `thread.post()` لـ OpenClaw. فهي تخفي حد المعاملة الذي
يقرر ما إذا كان الإرسال قابلًا للاسترداد.

## نموذج الجوهر

يجب أن يعيش النطاق الجديد تحت مساحة أسماء داخلية في الجوهر مثل
`src/channels/message/*`.

له أربعة مفاهيم:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

يمتلك `receive` دورة حياة الوارد.

يمتلك `send` دورة حياة الصادر.

يمتلك `live` حالة المعاينة، والتعديل، والتقدم، والبث.

يمتلك `state` تخزين النوايا الدائم، والإيصالات، وانعدام التكرار، والاسترداد، والأقفال،
وإزالة التكرار.

## مصطلحات الرسائل

### الرسالة

الرسالة المطَبَّعة محايدة تجاه المنصة:

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

الرد علاقة، وليس جذر واجهة API:

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

يتيح هذا لمسار الإرسال نفسه التعامل مع الردود العادية، وإشعارات Cron، ومطالبات
الموافقة، وإكمالات المهام، وإرسالات أدوات الرسائل، وإرسالات CLI أو Control UI،
ونتائج الوكلاء الفرعيين، وإرسالات الأتمتة.

### المنشأ

يصف المنشأ من أنتج رسالة وكيف يجب أن يتعامل OpenClaw مع أصداء تلك الرسالة.
وهو منفصل عن العلاقة: يمكن أن تكون الرسالة ردًا على مستخدم وأن تكون في الوقت
نفسه مخرجات تشغيلية منشؤها OpenClaw.

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

يمتلك الجوهر معنى المخرجات ذات المنشأ من OpenClaw. وتمتلك القنوات طريقة ترميز
ذلك المنشأ في نقلها.

أول استخدام مطلوب هو مخرجات فشل Gateway. يجب أن يظل البشر يرون رسائل مثل
"فشل الوكيل قبل الرد" أو "مفتاح API مفقود"، لكن يجب عدم قبول المخرجات التشغيلية
الموسومة من OpenClaw كمدخلات مؤلفة بواسطة بوت في الغرف المشتركة عند تفعيل
`allowBots`.

### الإيصال

الإيصالات كيانات من الدرجة الأولى:

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

الإيصالات هي الجسر من النية الدائمة إلى التعديل، والحذف، وإنهاء المعاينة،
وكبح التكرار، والاسترداد في المستقبل.

يمكن أن يصف الإيصال رسالة منصة واحدة أو تسليمًا متعدد الأجزاء. يجب أن يحافظ
النص المجزأ، والوسائط مع النص، والصوت مع النص، وبدائل البطاقات على كل معرفات
المنصة مع الاستمرار في كشف معرف أساسي للربط الخيطي والتعديلات اللاحقة.

## سياق الاستلام

يجب ألا يكون الاستلام استدعاء مساعد مجردًا. يحتاج الجوهر إلى سياق يعرف إزالة
التكرار، والتوجيه، وتسجيل الجلسة، وسياسة إقرار المنصة.

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

- **إقرار النقل:** يخبر Webhook المنصة أو المقبس أن OpenClaw قبل غلاف الحدث.
  تتطلب بعض المنصات هذا قبل الإرسال.
- **إقرار إزاحة الاستطلاع:** يقدّم مؤشرًا حتى لا يجري جلب الحدث نفسه مرة أخرى.
  يجب ألا يتجاوز هذا عملًا لا يمكن استرداده.
- **إقرار سجل الوارد:** يؤكد أن OpenClaw احتفظ بما يكفي من بيانات الوارد الوصفية
  لإزالة تكرار إعادة التسليم وتوجيهها.
- **إيصال مرئي للمستخدم:** سلوك قراءة/حالة/كتابة اختياري؛ ليس حدًا للمتانة أبدًا.

يتحكم `ReceiveAckPolicy` في إقرار النقل أو الاستطلاع فقط. يجب ألا يعاد استخدامه
لإيصالات القراءة أو تفاعلات الحالة.

قبل تخويل البوت، يجب أن يطبق الاستلام سياسة صدى OpenClaw المشتركة عندما تستطيع
القناة فك ترميز بيانات منشأ الرسالة الوصفية:

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

هذا الإسقاط قائم على الوسم، لا على النص. تظل رسالة غرفة مؤلفة بواسطة بوت لها
نص فشل Gateway المرئي نفسه ولكن بلا بيانات وصفية لمنشأ OpenClaw تمر عبر تخويل
`allowBots` العادي.

سياسة الإقرار صريحة:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

يستخدم استطلاع Telegram الآن سياسة إقرار سياق الاستلام لعلامة ماء إعادة التشغيل
المحفوظة. لا يزال المتتبع يراقب تحديثات grammY عند دخولها سلسلة الوسطاء، لكن
OpenClaw لا يحفظ إلا معرف التحديث المكتمل الآمن بعد الإرسال الناجح، تاركًا
التحديثات الفاشلة أو المعلقة الأدنى قابلة لإعادة التشغيل بعد إعادة التشغيل.
لا يزال إزاحة جلب `getUpdates` العليا في Telegram خاضعة لتحكم مكتبة الاستطلاع،
لذا فإن القطع الأعمق المتبقي هو مصدر استطلاع دائم بالكامل إذا احتجنا إعادة
تسليم على مستوى المنصة تتجاوز علامة ماء إعادة التشغيل في OpenClaw. قد تحتاج
منصات Webhook إلى إقرار HTTP فوري، لكنها ما زالت تحتاج إلى إزالة تكرار الوارد
ونوايا إرسال صادرة دائمة لأن Webhooks يمكنها إعادة التسليم.

## سياق الإرسال

يستند الإرسال أيضًا إلى السياق:

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

يتوسع المساعد إلى:

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

يجب أن توجد النية قبل إدخال/إخراج النقل. تكون إعادة التشغيل بعد البدء ولكن قبل
التثبيت قابلة للاسترداد.

الحدّ الخطر يكون بعد نجاح المنصة وقبل تثبيت الإيصال. إذا توقفت العملية هناك،
فلا يستطيع OpenClaw معرفة ما إذا كانت رسالة المنصة موجودة إلا إذا وفر المحوّل
خاصية أصلية لمنع التكرار أو مسارًا لتسوية الإيصالات. يجب أن تُستأنف تلك
المحاولات في `unknown_after_send`، لا أن تُعاد عشوائيًا. يمكن للقنوات التي لا
تملك تسوية اختيار إعادة تشغيل وفق مبدأ مرة واحدة على الأقل فقط إذا كانت الرسائل
المرئية المكررة مفاضلة مقبولة وموثقة لتلك القناة والعلاقة. يتطلب جسر تسوية SDK
الحالي أن يعلن المحوّل `reconcileUnknownSend`، ثم يطلب من
`durableFinal.reconcileUnknownSend` تصنيف إدخال مجهول بوصفه `sent` أو
`not_sent` أو `unresolved`؛ وحده `not_sent` يسمح بإعادة التشغيل، وتبقى
الإدخالات غير المحسومة نهائية أو تعيد فقط محاولة فحص التسوية.

يجب أن تكون سياسة المتانة صريحة:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

يعني `required` أن على النواة أن تفشل بإغلاق آمن عندما لا تستطيع كتابة النية
المتينة. يمكن لـ `best_effort` المتابعة عندما لا يكون التخزين الدائم متاحًا.
يحافظ `disabled` على سلوك الإرسال المباشر القديم. أثناء الترحيل، تكون
المغلفات القديمة ومساعدات التوافق العامة افتراضيًا على `disabled`؛ ويجب ألا
تستنتج `required` من مجرد أن لدى قناة ما محوّلًا عامًا صادرًا.

تمتلك سياقات الإرسال أيضًا المؤثرات المحلية للقناة بعد الإرسال. لا يكون
الترحيل آمنًا إذا تجاوز التسليم المتين سلوكًا محليًا كان مرتبطًا سابقًا بمسار
الإرسال المباشر للقناة. تشمل الأمثلة مخازن منع صدى الذات، وعلامات المشاركة في
السلاسل، ومراسي التحرير الأصلية، وعرض توقيع النموذج، وحراس التكرار الخاصة
بالمنصة. يجب أن تنتقل تلك المؤثرات إما إلى محوّل الإرسال، أو محوّل العرض، أو
خطاف مسمى في سياق الإرسال قبل أن تتمكن تلك القناة من تمكين التسليم النهائي
العام المتين.

يجب أن تعيد مساعدات الإرسال الإيصالات طوال الطريق إلى مستدعيها. لا يمكن
للمغلفات المتينة ابتلاع معرفات الرسائل أو استبدال نتيجة تسليم قناة بـ
`undefined`؛ فالموزعات المخبأة تستخدم تلك المعرّفات لمراسي السلاسل، والتحريرات
اللاحقة، وإنهاء المعاينة، ومنع التكرار.

تعمل عمليات الإرسال الاحتياطية على دفعات، لا على حمولة واحدة. يمكن لإعادات
كتابة الردود الصامتة، والرجوع الاحتياطي للوسائط، والرجوع الاحتياطي للبطاقات،
وإسقاط المقاطع أن تنتج كلها أكثر من رسالة قابلة للتسليم، لذلك يجب على سياق
الإرسال إما تسليم الدفعة المسقطة كاملة أو توثيق سبب صلاحية حمولة واحدة فقط
صراحة.

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

عندما يكون مثل هذا الرجوع الاحتياطي متينًا، يجب تمثيل الدفعة المسقطة كلها
بنية إرسال متينة واحدة أو بخطة دفعات ذرية أخرى. تسجيل كل حمولة واحدة تلو
الأخرى ليس كافيًا: قد يترك التعطل بين الحمولات رجوعًا احتياطيًا مرئيًا جزئيًا
بلا سجل متين للحمولات المتبقية. يجب أن يعرف الاسترداد أي الوحدات لديها إيصالات
بالفعل، وأن يعيد تشغيل الوحدات المفقودة فقط أو يعلّم الدفعة
`unknown_after_send` حتى ينجز المحوّل تسويتها.

## السياق الحي

يجب أن تكون سلوكيات المعاينة والتحرير والتقدم والتدفق دورة حياة واحدة قابلة
للاشتراك.

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

الحالة الحية متينة بما يكفي للاسترداد أو منع التكرارات:

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

يجب أن يغطي هذا السلوك الحالي:

- إرسال Telegram مع تحرير المعاينة، مع نهائي جديد بعد تجاوز عمر المعاينة.
- إرسال Discord مع تحرير المعاينة، والإلغاء عند وجود وسائط أو خطأ أو رد صريح.
- تدفق Slack الأصلي أو معاينة مسودة بحسب شكل السلسلة.
- إنهاء منشور مسودة Mattermost.
- إنهاء حدث مسودة Matrix أو تنقيحه عند عدم التطابق.
- تدفق تقدم أصلي في Teams.
- تدفق QQ Bot أو رجوع احتياطي متراكم.

## سطح المحوّل

يجب أن يكون هدف SDK العام مسارًا فرعيًا واحدًا:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

الشكل المستهدف:

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

محوّل الإرسال:

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

محوّل الاستقبال:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

قبل تخويل الفحص المسبق، يجب على النواة تشغيل مسند صدى OpenClaw المشترك كلما
أعاد `origin.decode` بيانات وصفية لمنشأ OpenClaw. يزوّد محوّل الاستقبال حقائق
المنصة مثل كاتب الروبوت وشكل الغرفة؛ وتمتلك النواة قرار الإسقاط وترتيبه حتى لا
تعيد القنوات تنفيذ مرشحات النصوص.

محوّل المنشأ:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

تعيّن النواة `MessageOrigin`. لا تفعل القنوات إلا ترجمته من وإلى بيانات النقل
الأصلية. يربط Slack ذلك بـ `chat.postMessage({ metadata })` و
`message.metadata` الواردة؛ ويمكن لـ Matrix ربطه بمحتوى حدث إضافي؛ ويمكن
للقنوات التي لا تملك بيانات وصفية أصلية استخدام سجل إيصالات/صادر عندما يكون
ذلك أفضل تقريب متاح.

القدرات:

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

## تقليص SDK العام

يجب أن يمتص السطح العام الجديد هذه المجالات المفاهيمية أو يوقفها تدريجيًا:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- معظم الاستخدامات العامة لـ `outbound-runtime`
- مساعدات دورة حياة تدفق المسودات المخصصة

يمكن أن تبقى المسارات الفرعية الخاصة بالتوافق كمغلفات، لكن لا ينبغي أن تحتاج
إليها Plugins خارجية جديدة.

يمكن أن تحتفظ Plugins المضمنة باستيرادات المساعدات الداخلية عبر مسارات فرعية
محجوزة وقت التشغيل أثناء الترحيل. يجب أن توجه الوثائق العامة مؤلفي Plugins إلى
`plugin-sdk/channel-message` بعد وجوده.

## العلاقة بدورة القناة

يجب أن يبقى `runtime.channel.turn.*` أثناء الترحيل.

يجب أن يصبح محوّل توافق:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

يجب أيضًا أن يبقى `channel.turn.runPrepared` مبدئيًا:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

بعد ربط كل Plugins المضمنة ومسارات توافق الجهات الخارجية المعروفة، يمكن إيقاف
`channel.turn` تدريجيًا. يجب ألا يُزال حتى يوجد مسار ترحيل منشور لـ SDK
واختبارات عقد تثبت أن Plugins القديمة ما زالت تعمل أو تفشل بخطأ إصدار واضح.

## حواجز التوافق

أثناء الترحيل، يكون التسليم العام المتين اختياريًا لأي قناة يملك استدعاء
التسليم الحالي فيها مؤثرات جانبية تتجاوز "أرسل هذه الحمولة".

نقاط الدخول القديمة غير متينة افتراضيًا:

- يستخدم `channel.turn.run` و `dispatchAssembledChannelTurn` استدعاء التسليم
  الخاص بالقناة ما لم توفر تلك القناة صراحة كائن سياسة/خيارات متانة مدققًا.
- يبقى `channel.turn.runPrepared` مملوكًا للقناة حتى يستدعي الموزع المحضّر
  سياق الإرسال صراحة.
- لا تحقن مساعدات التوافق العامة مثل `recordInboundSessionAndDispatchReply` و
  `dispatchInboundReplyWithBase` ومساعدات الرسائل المباشرة العامة تسليمًا
  عامًا متينًا قبل استدعاء `deliver` أو `reply` الذي يقدمه المستدعي.

بالنسبة إلى أنواع جسور الترحيل، تعني `durable: undefined` "غير متين". لا
يُفعّل المسار المتين إلا بقيمة سياسة/خيارات صريحة. يمكن أن تبقى `durable:
false` كصياغة توافق، لكن يجب ألا يتطلب التنفيذ من كل قناة غير مرحّلة إضافتها.

يجب أن يبقي كود الجسر الحالي قرار المتانة صريحًا:

- يُرجع التسليم النهائي المتين حالةً مميَّزة. تكون `handled_visible` و
  `handled_no_send` نهائيتين؛ وقد تعود `unsupported` و `not_applicable`
  إلى التسليم المملوك للقناة؛ وتنقل `failed` فشل الإرسال.
- يُحرس التسليم النهائي المتين العام بقدرات المحوِّل مثل
  التسليم الصامت، والحفاظ على هدف الرد، والحفاظ على الاقتباس الأصلي، و
  خطافات إرسال الرسائل. عند غياب التكافؤ، ينبغي اختيار التسليم المملوك للقناة،
  لا إرسال عام يغيّر السلوك المرئي للمستخدم.
- تكشف عمليات الإرسال المتينة المدعومة بالطابور مرجع نية تسليم. يمكن لحقول الجلسة
  `pendingFinalDelivery*` الحالية حمل معرّف النية أثناء
  الانتقال؛ وتكون الحالة النهائية مخزن `MessageSendIntent` بدلاً من نص رد
  مجمّد مع حقول سياق مخصصة.

لا تفعّل المسار المتين العام لقناة حتى تكون كل الشروط التالية
صحيحة:

- ينفّذ محوِّل الإرسال العام سلوك العرض والنقل نفسه الذي كان ينفّذه
  المسار المباشر القديم.
- تُحفظ الآثار الجانبية المحلية بعد الإرسال من خلال سياق الإرسال.
- يُرجع المحوِّل إيصالات أو نتائج تسليم تحتوي على كل معرّفات رسائل
  المنصة.
- إما أن تستدعي مسارات المرسِل المحضَّرة سياق الإرسال الجديد، أو تبقى موثّقة
  على أنها خارج ضمان المتانة.
- يتعامل تسليم الرجوع الاحتياطي مع كل حمولة متوقعة، لا الأولى فقط.
- يسجّل تسليم الرجوع الاحتياطي المتين مصفوفة الحمولات المتوقعة كلها كنية واحدة
  قابلة لإعادة التشغيل أو خطة دفعة.

مخاطر ترحيل ملموسة يجب الحفاظ عليها:

- يسجّل تسليم مراقب iMessage الرسائل المرسلة في ذاكرة صدى مؤقتة بعد
  إرسال ناجح. يجب أن تظل عمليات الإرسال النهائي المتينة تملأ تلك الذاكرة المؤقتة، وإلا
  يمكن أن يعيد OpenClaw ابتلاع ردوده النهائية الخاصة كرسائل مستخدم واردة.
- يضيف Tlon توقيع نموذج اختياريًا ويسجّل الخيوط التي شارك فيها
  بعد ردود المجموعات. يجب ألا يتجاوز التسليم المتين العام تلك الآثار؛
  إما انقلها إلى محوِّلات العرض/الإرسال/الإنهاء في Tlon أو أبقِ Tlon على
  المسار المملوك للقناة.
- يمتلك Discord والمرسِلون المحضَّرون الآخرون بالفعل سلوك التسليم المباشر والمعاينة.
  ولا يغطيهم ضمان المتانة للدورة المجمَّعة حتى
  توجّه مرسِلاتهم المحضَّرة الردود النهائية صراحةً عبر سياق الإرسال.
- يجب أن يسلّم تسليم الرجوع الاحتياطي الصامت في Telegram مصفوفة الحمولات المتوقعة
  كاملة. قد يؤدي اختصار الحمولة الواحدة إلى إسقاط حمولات رجوع احتياطي إضافية بعد
  الإسقاط.
- قد تحتوي LINE و BlueBubbles و Zalo و Nostr وغيرها من المسارات المجمَّعة/المساعدة الحالية
  على تعامل مع رموز الرد، أو تمرير وسائط عبر وكيل، أو ذاكرات مؤقتة للرسائل المرسلة، أو تنظيف تحميل/حالة،
  أو أهداف لا تعمل إلا باستدعاء راجع. تبقى هذه على التسليم المملوك للقناة حتى
  تُمثَّل تلك الدلالات بواسطة محوِّل الإرسال وتتحقق منها الاختبارات.
- قد تحتوي مساعدات الرسائل المباشرة على استدعاء راجع للرد يكون هو هدف النقل الصحيح الوحيد.
  يجب ألا يخمّن الصادر العام من `OriginatingTo` أو `To` ويتجاوز
  ذلك الاستدعاء الراجع.
- يجب أن يبقى خرج فشل Gateway في OpenClaw مرئيًا للبشر، لكن يجب إسقاط
  أصداء الغرف الموسومة والمؤلفة بواسطة بوت قبل تخويل `allowBots`.
  يجب ألا تنفّذ القنوات ذلك بمرشحات بادئة النص المرئي إلا كحل
  طارئ قصير؛ العقد المتين هو بيانات تعريف منشأ مهيكلة.

## التخزين الداخلي

ينبغي أن يخزّن الطابور نوايا إرسال الرسائل، لا حمولات الردود.

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

ينبغي أن يحتفظ الطابور بما يكفي من الهوية لإعادة التشغيل عبر الحساب نفسه،
والخيط، والهدف، وسياسة التنسيق، وقواعد الوسائط بعد إعادة التشغيل.

## فئات الفشل

تصنّف محوِّلات القنوات حالات فشل النقل إلى فئات مغلقة:

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
- لا تعد محاولة `invalid_payload` إلا إذا كان هناك رجوع احتياطي للعرض.
- لا تعد محاولة `auth` أو `permission` حتى يتغير التكوين.
- بالنسبة إلى `not_found`، اسمح للإنهاء الحي بالرجوع من التعديل إلى إرسال جديد عندما
  تعلن القناة أن ذلك آمن.
- بالنسبة إلى `conflict`، استخدم قواعد الإيصال/عدم التكرار لتقرير ما إذا كانت الرسالة
  موجودة بالفعل.
- أي خطأ يحدث بعد أن يكون المحوِّل قد أتم إدخال/إخراج المنصة لكن قبل تثبيت الإيصال
  يصبح `unknown_after_send` ما لم يستطع المحوِّل إثبات أن عملية المنصة
  لم تحدث.

## ربط القنوات

| القناة                  | الهجرة المستهدفة                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | تلقي سياسة الإقرار بالإضافة إلى إرسال نهائي مستدام. يتولى المحوّل الحي الإرسال بالإضافة إلى تحرير المعاينة، والإرسال النهائي للمعاينة القديمة، والمواضيع، وتخطي معاينة الرد المقتبس، والرجوع الاحتياطي للوسائط، والتعامل مع `retry-after`.                                                                                                                                                                   |
| Discord                  | يغلّف محوّل الإرسال تسليم الحمولة المستدامة الحالية. يتولى المحوّل الحي تحرير المسودة، ومسودة التقدم، وإلغاء معاينة الوسائط/الأخطاء، والحفاظ على هدف الرد، وإيصالات معرّفات الرسائل. راجع أصداء إخفاقات Gateway المكتوبة بواسطة البوت في الغرف المشتركة؛ استخدم سجلًا صادرًا أو مكافئًا أصليًا آخر إذا تعذر على Discord حمل بيانات تعريف المصدر في الرسائل العادية. |
| Slack                    | يتعامل محوّل الإرسال مع منشورات الدردشة العادية. يختار المحوّل الحي البث الأصلي عندما يدعم شكل السلسلة ذلك، وإلا يستخدم معاينة مسودة. تحفظ الإيصالات الطوابع الزمنية للسلاسل. يربط محوّل المصدر إخفاقات OpenClaw Gateway بـ `chat.postMessage.metadata` في Slack ويسقط أصداء غرف البوت الموسومة قبل تفويض `allowBots`.                                  |
| WhatsApp                 | يتولى محوّل الإرسال إرسال النصوص/الوسائط مع نوايا نهائية مستدامة. يتعامل محوّل التلقي مع ذكر المجموعة وهوية المرسل. يمكن أن يبقى المحوّل الحي غائبًا إلى أن يتوفر في WhatsApp نقل قابل للتحرير.                                                                                                                                                                        |
| Matrix                   | يتولى المحوّل الحي تحريرات أحداث المسودة، والإنهاء، والتنقيح، وقيود الوسائط المشفرة، والرجوع الاحتياطي عند عدم تطابق هدف الرد. يتولى محوّل التلقي ترطيب الأحداث المشفرة وإزالة التكرار. ينبغي أن يرمّز محوّل المصدر مصدر إخفاق OpenClaw Gateway ضمن محتوى حدث Matrix وأن يسقط أصداء غرف البوت المهيأة قبل التعامل مع `allowBots`.              |
| Mattermost               | يتولى المحوّل الحي منشور مسودة واحدًا، وطيّ التقدم/الأدوات، والإنهاء في الموضع نفسه، والرجوع الاحتياطي بإرسال جديد.                                                                                                                                                                                                                                                       |
| Microsoft Teams          | يتولى المحوّل الحي التقدم الأصلي وسلوك بث الكتل. يتولى محوّل الإرسال الأنشطة وإيصالات المرفقات/البطاقات.                                                                                                                                                                                                                                        |
| Feishu                   | يتولى محوّل العرض عرض النص/البطاقة/المحتوى الخام. يتولى المحوّل الحي بطاقات البث ومنع تكرار الرسالة النهائية. يتولى محوّل الإرسال التعليقات، وجلسات المواضيع، والوسائط، وكبت الصوت.                                                                                                                                                                      |
| QQ Bot                   | يتولى المحوّل الحي بث C2C، ومهلة المجمّع، والإرسال النهائي الاحتياطي. يتولى محوّل العرض وسوم الوسائط وتحويل النص إلى صوت.                                                                                                                                                                                                                               |
| Signal                   | تلقي بسيط بالإضافة إلى محوّل إرسال. لا يوجد محوّل حي ما لم يضف signal-cli دعم تحرير موثوقًا.                                                                                                                                                                                                                                                                |
| iMessage و BlueBubbles | تلقي بسيط بالإضافة إلى محوّل إرسال. يجب أن يحافظ إرسال iMessage على تعبئة ذاكرة صدى المراقب المؤقتة قبل أن تتمكن الرسائل النهائية المستدامة من تجاوز تسليم المراقب. تظل الكتابة، والتفاعلات، والمرفقات الخاصة بـ BlueBubbles قدرات للمحوّل.                                                                                                                            |
| Google Chat              | تلقي بسيط بالإضافة إلى محوّل إرسال مع ربط علاقة السلسلة بالمساحات ومعرّفات السلاسل. راجع سلوك غرف `allowBots=true` لأصداء إخفاق OpenClaw Gateway الموسومة.                                                                                                                                                                                        |
| LINE                     | تلقي بسيط بالإضافة إلى محوّل إرسال مع نمذجة قيود رمز الرد كقدرة هدف/علاقة.                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | جسر تلقي SDK بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                          |
| IRC                      | تلقي بسيط بالإضافة إلى محوّل إرسال، من دون إيصالات تحرير مستدامة.                                                                                                                                                                                                                                                                                                    |
| Nostr                    | تلقي بالإضافة إلى محوّل إرسال للرسائل المباشرة المشفرة؛ الإيصالات هي معرّفات الأحداث.                                                                                                                                                                                                                                                                                           |
| QA Channel               | محوّل اختبارات عقد لسلوك التلقي، والإرسال، والبث الحي، وإعادة المحاولة، والاسترداد.                                                                                                                                                                                                                                                                                   |
| Synology Chat            | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | يجب أن يحافظ محوّل الإرسال على عرض توقيع النموذج وتتبع السلاسل المشاركة قبل تمكين التسليم النهائي المستدام العام.                                                                                                                                                                                                                        |
| Twitch                   | تلقي بسيط بالإضافة إلى محوّل إرسال مع تصنيف حدود المعدل.                                                                                                                                                                                                                                                                                               |
| Zalo                     | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |

## خطة الهجرة

### المرحلة 1: نطاق الرسائل الداخلي

- أضف أنواع `src/channels/message/*` للرسائل، والأهداف، والعلاقات،
  والمصادر، والإيصالات، والقدرات، والنوايا المستدامة، وسياق التلقي، وسياق الإرسال،
  والسياق الحي، وفئات الإخفاق.
- أضف `origin?: MessageOrigin` إلى نوع حمولة جسر الهجرة المستخدم بواسطة
  تسليم الرد الحالي، ثم انقل ذلك الحقل إلى `ChannelMessage` وأنواع
  الرسائل المعروضة عندما تستبدل إعادة الهيكلة حمولات الرد.
- أبقِ هذا داخليًا إلى أن تثبت المحوّلات والاختبارات الشكل.
- أضف اختبارات وحدة صافية لانتقالات الحالة والتسلسل.

### المرحلة 2: نواة الإرسال المستدام

- انقل قائمة الانتظار الصادرة الحالية من استدامة حمولة الرد إلى نوايا
  إرسال الرسائل المستدامة.
- اسمح لنوايا الإرسال المستدامة بحمل مصفوفة حمولات مسقطة أو خطة دفعات، وليس
  حمولة رد واحدة فقط.
- حافظ على سلوك استرداد قائمة الانتظار الحالي عبر تحويل التوافق.
- اجعل `deliverOutboundPayloads` يستدعي `messages.send`.
- اجعل استدامة الإرسال النهائي هي الافتراضي وأغلق بالفشل عندما لا يمكن
  كتابة النية المستدامة في دورة حياة الرسالة الجديدة، بعد أن يعلن المحوّل
  أمان إعادة التشغيل. تظل مسارات توافق channel-turn و SDK الحالية
  إرسالًا مباشرًا افتراضيًا خلال هذه المرحلة.
- سجّل الإيصالات باتساق.
- أرجع الإيصالات ونتائج التسليم إلى مستدعي الموزّع الأصلي بدلًا من
  التعامل مع الإرسال المستدام كتأثير جانبي نهائي.
- ثبّت مصدر الرسالة عبر نوايا الإرسال المستدامة بحيث يحافظ الاسترداد،
  وإعادة التشغيل، والإرسالات المجزأة على منشأ OpenClaw التشغيلي.

### المرحلة 3: جسر دورة القناة

- أعد تنفيذ `channel.turn.run` و `dispatchAssembledChannelTurn` فوق
  `messages.receive` و `messages.send`.
- أبقِ أنواع الحقائق الحالية مستقرة.
- أبقِ السلوك القديم افتراضيًا. لا تصبح قناة الدورة المجمّعة مستدامة
  إلا عندما يختار محوّلها ذلك صراحةً بسياسة استدامة آمنة لإعادة التشغيل.
- أبقِ `durable: false` كمخرج توافق للمسارات التي تنهي تحريرات أصلية
  ولا تستطيع إعادة التشغيل بأمان بعد، لكن لا تعتمد على علامات `false`
  لحماية القنوات غير المهاجرة.
- اجعل استدامة الدورة المجمّعة افتراضية فقط في دورة حياة الرسالة الجديدة، بعد
  أن يثبت ربط القناة أن مسار الإرسال العام يحافظ على دلالات تسليم القناة القديمة.

### المرحلة 4: جسر الموزّع المحضّر

- استبدل `deliverDurableInboundReplyPayload` بجسر سياق إرسال.
- أبقِ المساعد القديم كغلاف.
- انقل Telegram وWhatsApp وSlack وSignal وiMessage وDiscord أولًا لأن
  لديها بالفعل عمل نهائي دائم أو مسارات إرسال أبسط.
- عامل كل موزّع مُحضّر على أنه غير مغطى إلى أن يشترك صراحةً في
  سياق الإرسال. يجب أن تقول الوثائق وإدخالات سجل التغييرات "منعطفات القناة
  المجمّعة" أو تسمّي مسارات القنوات المرحّلة بدلًا من الادعاء بكل الردود
  النهائية التلقائية.
- حافظ على سلوك `recordInboundSessionAndDispatchReply` ومساعدات الرسائل المباشرة
  ومساعدات التوافق العامة المشابهة كما هو. قد تكشف لاحقًا عن اشتراك صريح
  في سياق الإرسال، لكنها يجب ألا تحاول تلقائيًا إجراء تسليم دائم عام قبل
  استدعاء التسليم الذي يملكه المستدعي.

### المرحلة 5: دورة حياة مباشرة موحّدة

- ابنِ `messages.live` بمحوّلين لإثبات المفهوم:
  - Telegram للإرسال مع التحرير مع إرسال نهائي جديد عند التقادم.
  - Matrix لإنهاء المسودة مع احتياطي الحجب.
- ثم رحّل Discord وSlack وMattermost وTeams وQQ Bot وFeishu.
- احذف كود إنهاء المعاينة المكرر فقط بعد أن تصبح لكل قناة
  اختبارات تكافؤ.

### المرحلة 6: SDK العام

- أضف `openclaw/plugin-sdk/channel-message`.
- وثّقه باعتباره API Plugin القنوات المفضّل.
- حدّث صادرات الحزمة، ومخزون نقاط الدخول، وخطوط أساس API المولّدة، ووثائق SDK الخاص بالـPlugin.
- ضمّن `MessageOrigin` وخطافات ترميز/فك ترميز الأصل، والدالة الشرطية المشتركة
  `shouldDropOpenClawEcho` ضمن سطح SDK الخاص بـchannel-message.
- أبقِ أغلفة التوافق للمسارات الفرعية القديمة.
- علّم مساعدات SDK التي تحمل أسماء الردود على أنها مهملة في الوثائق بعد ترحيل Plugins المضمنة.

### المرحلة 7: كل المرسلين

انقل كل منتجي الخروج غير الردّي إلى `messages.send`:

- إشعارات Cron وHeartbeat
- إكمالات المهام
- نتائج الخطافات
- مطالبات الموافقة ونتائج الموافقة
- عمليات إرسال أداة الرسائل
- إعلانات إكمال الوكيل الفرعي
- عمليات الإرسال الصريحة من CLI أو Control UI
- مسارات الأتمتة/البث

هنا يتوقف النموذج عن كونه "ردود الوكيل" ويصبح "يرسل OpenClaw
رسائل".

### المرحلة 8: إهمال Turn

- أبقِ `channel.turn` كغلاف لنافذة توافق واحدة على الأقل.
- انشر ملاحظات الترحيل.
- شغّل اختبارات توافق SDK الخاص بالـPlugin على الاستيرادات القديمة.
- أزل أو أخفِ المساعدات الداخلية القديمة فقط بعد ألا يعود أي Plugin مضمن بحاجة إليها
  وبعد أن تمتلك عقود الأطراف الثالثة بديلًا مستقرًا.

## خطة الاختبار

اختبارات الوحدة:

- تسلسل نية الإرسال الدائم واستردادها.
- إعادة استخدام مفتاح عدم التكرار ومنع التكرارات.
- تثبيت الإيصال وتجاوز إعادة التشغيل.
- استرداد `unknown_after_send` الذي يوفّق قبل إعادة التشغيل عندما يدعم المحوّل
  التوفيق.
- سياسة تصنيف الفشل.
- تسلسل سياسة إقرار الاستلام.
- ربط العلاقات لإرسالات الرد والمتابعة والنظام والبث.
- مصنع أصل فشل Gateway والدالة الشرطية `shouldDropOpenClawEcho`.
- حفظ الأصل عبر تطبيع الحمولة، والتقسيم إلى أجزاء، وتسلسل الطابور الدائم، والاسترداد.

اختبارات التكامل:

- لا يزال محوّل `channel.turn.run` البسيط يسجل ويرسل.
- لا يتحول تسليم المنعطف المجمّع القديم إلى دائم إلا إذا اشتركت القناة
  صراحةً.
- لا يزال جسر `channel.turn.runPrepared` يسجل وينهي.
- تستدعي مساعدات التوافق العامة استدعاءات التسليم التي يملكها المستدعي افتراضيًا
  ولا ترسل إرسالًا عامًا قبل تلك الاستدعاءات.
- يعيد تسليم الاحتياطي الدائم تشغيل كامل مصفوفة الحمولات المسقطة بعد
  إعادة التشغيل، ولا يمكنه ترك الحمولات اللاحقة غير مسجلة بعد تعطل مبكر.
- يعيد تسليم المنعطف المجمّع الدائم معرّفات رسائل المنصة إلى الموزّع
  المخزّن مؤقتًا.
- لا تزال خطافات التسليم المخصصة تعيد معرّفات رسائل المنصة عندما يكون التسليم الدائم
  معطلًا أو غير متاح.
- ينجو الرد النهائي من إعادة التشغيل بين إكمال المساعد وإرسال المنصة.
- تُنهى مسودة المعاينة في مكانها عندما يكون ذلك مسموحًا.
- تُلغى مسودة المعاينة أو تُحجب عندما يتطلب عدم تطابق الوسائط/الخطأ/هدف الرد
  تسليمًا عاديًا.
- لا يسلّم كل من بث الكتل وبث المعاينة النص نفسه.
- لا تُكرّر الوسائط التي بُثت مبكرًا في التسليم النهائي.

اختبارات القنوات:

- رد موضوع Telegram مع تأخير إقرار الاستطلاع حتى العلامة المائية المكتملة الآمنة
  لسياق الاستلام.
- استرداد استطلاع Telegram للتحديثات المقبولة ولكن غير المسلّمة مغطى بواسطة
  نموذج إزاحة الآمن المكتمل المستمر.
- ترسل معاينة Telegram المتقادمة نهائيًا جديدًا وتنظف المعاينة.
- يرسل احتياطي Telegram الصامت كل حمولة احتياطية مسقطة.
- تسجل ديمومة احتياطي Telegram مصفوفة الاحتياطي المسقطة الكاملة
  ذريًا، وليس نية دائمة ذات حمولة واحدة لكل تكرار حلقة.
- إلغاء معاينة Discord عند الوسائط/الخطأ/الرد الصريح.
- تمر نهائيات موزّع Discord المحضّر عبر سياق الإرسال قبل أن تدعي الوثائق
  أو سجل التغييرات ديمومة الرد النهائي في Discord.
- تملأ الإرسالات النهائية الدائمة في iMessage ذاكرة صدى الرسائل المرسلة الخاصة بالمراقب.
- لا تُتجاوز مسارات التسليم القديمة في LINE وBlueBubbles وZalo وNostr بواسطة
  إرسال دائم عام حتى توجد اختبارات تكافؤ لمحوّلاتها.
- يظل تسليم استدعاء Direct-DM/Nostr هو المرجع ما لم يُرحّل صراحةً
  إلى هدف رسالة كامل ومحوّل إرسال آمن لإعادة التشغيل.
- تبقى رسائل فشل Gateway الخاصة بـOpenClaw الموسومة في Slack ظاهرة للخارج، وتسقط
  أصداء غرفة البوت الموسومة قبل `allowBots`، ولا تزال رسائل البوت غير الموسومة التي تحمل
  النص المرئي نفسه تتبع تفويض البوت العادي.
- احتياطي البث الأصلي في Slack إلى معاينة مسودة في الرسائل المباشرة ذات المستوى الأعلى.
- إنهاء معاينة Matrix واحتياطي الحجب.
- تسقط أصداء غرف Matrix الموسومة لفشل Gateway الخاص بـOpenClaw من حسابات البوت
  المكوّنة قبل معالجة `allowBots`.
- تغطي تدقيقات سلسلة فشل Gateway للغرف المشتركة في Discord وGoogle Chat
  أوضاع `allowBots` قبل الادعاء بالحماية العامة هناك.
- إنهاء مسودة Mattermost واحتياطي الإرسال الجديد.
- إنهاء التقدم الأصلي في Teams.
- منع تكرار النهائي في Feishu.
- احتياطي مهلة مجمّع QQ Bot.
- تحفظ الإرسالات النهائية الدائمة في Tlon عرض توقيع النموذج وتتبع
  الخيط المشارك فيه.
- إرسالات نهائية دائمة بسيطة في WhatsApp وSignal وiMessage وGoogle Chat وLINE وIRC وNostr وNextcloud Talk
  وSynology Chat وTlon وTwitch وZalo وZalo Personal.

التحقق:

- ملفات Vitest مستهدفة أثناء التطوير.
- `pnpm check:changed` في Testbox لكامل السطح المتغيّر.
- `pnpm check` أوسع في Testbox قبل إنزال إعادة الهيكلة الكاملة أو بعد
  تغييرات SDK/الصادرات العامة.
- اختبار دخان مباشر أو qa-channel لقناة واحدة على الأقل قادرة على التحرير وقناة واحدة
  بسيطة للإرسال فقط قبل إزالة أغلفة التوافق.

## الأسئلة المفتوحة

- هل ينبغي لـTelegram في النهاية أن يستبدل مصدر مشغّل grammY بمصدر استطلاع
  دائم بالكامل يستطيع التحكم في إعادة التسليم على مستوى المنصة، وليس فقط
  علامة إعادة التشغيل المستمرة في OpenClaw.
- هل ينبغي تخزين حالة المعاينة المباشرة الدائمة في سجل الطابور نفسه
  مثل نية الإرسال النهائي أم في مخزن حالة مباشرة شقيق.
- إلى متى تبقى أغلفة التوافق موثقة بعد شحن
  `plugin-sdk/channel-message`.
- هل ينبغي لـPlugins الأطراف الثالثة تنفيذ محوّلات الاستلام مباشرة أم الاكتفاء
  بتقديم خطافات التطبيع/الإرسال/البث عبر `defineChannelMessageAdapter`.
- أي حقول الإيصال آمنة للكشف عنها في SDK العام مقابل حالة وقت التشغيل
  الداخلية.
- هل ينبغي نمذجة الآثار الجانبية مثل ذاكرات صدى الذات ومؤشرات الخيوط المشاركة
  كخطافات سياق إرسال، أو خطوات إنهاء يملكها المحوّل، أو مشتركين في الإيصالات.
- أي القنوات لديها بيانات وصفية أصلية للأصل، وأيها تحتاج إلى سجلات خروج مستمرة،
  وأيها لا يمكنها تقديم منع صدى موثوق عبر البوتات.

## معايير القبول

- ترسل كل قناة رسائل مضمنة الخرج النهائي المرئي عبر
  `messages.send`.
- تدخل كل قناة رسائل واردة عبر `messages.receive` أو غلاف توافق
  موثق.
- تستخدم كل قناة معاينة/تحرير/بث `messages.live` لحالة المسودة
  والإنهاء.
- `channel.turn` ليس إلا غلافًا.
- مساعدات SDK المسماة بالردود هي صادرات توافق، وليست المسار الموصى به.
- يستطيع الاسترداد الدائم إعادة تشغيل الإرسالات النهائية المعلقة بعد إعادة التشغيل دون فقدان
  الرد النهائي أو تكرار الإرسالات المثبتة بالفعل؛ وتُوفّق الإرسالات التي
  تكون نتيجتها على المنصة مجهولة قبل إعادة التشغيل أو تُوثّق على أنها
  مرة واحدة على الأقل لذلك المحوّل.
- تفشل الإرسالات النهائية الدائمة بشكل مغلق عندما لا يمكن كتابة النية الدائمة،
  إلا إذا اختار المستدعي صراحةً وضعًا غير دائم موثقًا.
- تعود مساعدات توافق channel-turn وSDK القديمة افتراضيًا إلى التسليم المباشر
  الذي تملكه القناة؛ الإرسال الدائم العام اشتراك صريح فقط.
- تحفظ الإيصالات كل معرّفات رسائل المنصة للتسليمات متعددة الأجزاء ومعرّفًا
  أساسيًا لسهولة الخيط/التحرير.
- تحفظ الأغلفة الدائمة الآثار الجانبية المحلية للقناة قبل استبدال
  استدعاءات التسليم المباشر.
- لا تُحتسب الموزّعات المحضّرة كدائمة حتى يستخدم مسار تسليمها النهائي
  سياق الإرسال صراحةً.
- يعالج تسليم الاحتياطي كل حمولة مسقطة.
- يسجل تسليم الاحتياطي الدائم كل حمولة مسقطة في نية واحدة قابلة لإعادة التشغيل
  أو خطة دفعات.
- يكون خرج فشل Gateway الصادر من OpenClaw مرئيًا للبشر، لكن أصداء الغرف الموسومة
  والمؤلفة بواسطة البوتات تسقط قبل تفويض البوت على القنوات التي
  تعلن دعم عقد الأصل.
- تشرح الوثائق الإرسال، والاستلام، والمباشر، والحالة، والإيصالات، والعلاقات، وسياسة
  الفشل، والترحيل، وتغطية الاختبارات.

## ذو صلة

- [الرسائل](/ar/concepts/messages)
- [البث والتقسيم إلى أجزاء](/ar/concepts/streaming)
- [مسودات التقدم](/ar/concepts/progress-drafts)
- [سياسة إعادة المحاولة](/ar/concepts/retry)
- [نواة منعطف القناة](/ar/plugins/sdk-channel-turn)

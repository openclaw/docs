---
read_when:
    - إعادة هيكلة سلوك إرسال القناة أو استقبالها
    - تغيير وارد القناة، وإرسال الردود، وقائمة انتظار الصادر، وبث المعاينة، أو واجهات API لرسائل Plugin SDK
    - تصميم Plugin قناة جديد يحتاج إلى عمليات إرسال دائمة أو إيصالات أو معاينات أو تعديلات أو إعادة محاولات
summary: خطة تصميم لدورة حياة موحّدة ودائمة لاستلام الرسائل وإرسالها ومعاينتها وتحريرها وبثّها
title: إعادة هيكلة دورة حياة الرسائل
x-i18n:
    generated_at: "2026-06-27T17:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

هذه الصفحة هي التصميم المستهدف لاستبدال مساعدين متفرقين لاستقبال القنوات، وإرسال الردود،
وبث المعاينات، والتسليم الصادر، بدورة حياة رسائل واحدة ودائمة.

النسخة المختصرة:

- يجب أن تكون البدائيات الأساسية هي **receive** و **send**، لا **reply**.
- الرد ليس إلا علاقة على رسالة صادرة.
- الدور وسيلة ملائمة لمعالجة الوارد، وليس مالك التسليم.
- يجب أن يكون الإرسال قائمًا على السياق: `begin`، التصيير، المعاينة أو البث، الإرسال النهائي،
  التثبيت، الفشل.
- يجب أن يكون الاستقبال قائمًا على السياق أيضًا: التطبيع، إزالة التكرار، التوجيه، التسجيل،
  الإرسال للمعالجة، إقرار المنصة، الفشل.
- يجب أن تنكمش SDK العامة للـ Plugin إلى سطح صغير واحد للصادر من القنوات.

## المشكلات

نمت حزمة القنوات الحالية من عدة احتياجات محلية صحيحة:

- تستخدم محولات الوارد البسيطة `runtime.channel.inbound.run`.
- تستخدم المحولات الغنية `runtime.channel.inbound.runPreparedReply`.
- تستخدم المساعدات القديمة `dispatchInboundReplyWithBase`،
  و`recordInboundSessionAndDispatchReply`، ومساعدات حمولة الرد، وتجزئة الردود،
  ومراجع الرد، ومساعدات وقت التشغيل الصادر.
- يعيش بث المعاينة في مرسلات خاصة بالقنوات.
- تجري إضافة ديمومة التسليم النهائي حول مسارات حمولة الرد الحالية.

يعالج هذا الشكل أخطاء محلية، لكنه يترك OpenClaw مع عدد كبير جدًا من المفاهيم العامة
وعدد كبير جدًا من الأماكن التي يمكن أن تنحرف فيها دلالات التسليم.

مشكلة الموثوقية التي كشفت ذلك هي:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

الثابت المستهدف أوسع من Telegram: بمجرد أن يقرر المركز أن رسالة صادرة مرئية
يجب أن توجد، يجب أن تكون النية دائمة قبل محاولة إرسال المنصة، ويجب تثبيت إيصال
المنصة بعد النجاح. يمنح ذلك OpenClaw استردادًا بمعنى مرة واحدة على الأقل.
لا يوجد سلوك مرة واحدة بالضبط إلا للمحولات التي تستطيع إثبات التماثل الأصلي
أو مطابقة محاولة ذات نتيجة مجهولة بعد الإرسال مع حالة المنصة قبل إعادة التشغيل.

هذه هي الحالة النهائية لهذا التصحيح البنيوي، وليست وصفًا لكل مسار حالي.
أثناء الترحيل، يمكن لمساعدات الصادر الحالية أن تظل تسقط إلى إرسال مباشر عند فشل
كتابات الطابور بأفضل جهد. لا يكتمل التصحيح البنيوي إلا عندما تفشل الإرسالات النهائية
الدائمة بإغلاق صريح أو تختار الخروج صراحة بسياسة موثقة غير دائمة.

## الأهداف

- دورة حياة مركزية واحدة لكل مسارات استقبال وإرسال رسائل القنوات.
- إرسالات نهائية دائمة افتراضيًا في دورة حياة الرسائل الجديدة بعد أن يعلن المحول
  سلوكًا آمنًا لإعادة التشغيل.
- دلالات مشتركة للمعاينة، والتعديل، والبث، والإنهاء، وإعادة المحاولة، والاسترداد، والإيصال.
- سطح SDK صغير للـ Plugin يمكن للـ Plugins الخارجية تعلمه وصيانته.
- توافق لمستدعي توافق رد الوارد الحاليين أثناء الترحيل.
- نقاط امتداد واضحة لقدرات القنوات الجديدة.
- لا فروع خاصة بمنصات محددة في المركز.
- لا رسائل قناة بدلتا الرموز. يظل بث القنوات معاينة رسالة،
  أو تعديلًا، أو إلحاقًا، أو تسليم كتلة مكتملة.
- بيانات تعريف منظمة من منشأ OpenClaw للمخرجات التشغيلية/النظامية حتى لا تدخل
  أعطال Gateway المرئية مجددًا إلى الغرف المشتركة المفعلة للبوت كطلبات جديدة.

## غير الأهداف

- عدم إجبار كل قناة حالية على تسليم الرسائل الدائم في المرحلة الأولى.
- عدم إجبار كل قناة على سلوك النقل الأصلي نفسه.
- عدم تعليم المركز مواضيع Telegram، أو البث الأصلي في Slack، أو تنقيحات Matrix،
  أو بطاقات Feishu، أو صوت QQ، أو أنشطة Teams.
- عدم نشر كل مساعدات الترحيل الداخلية كواجهة SDK مستقرة.
- عدم جعل إعادة المحاولة تعيد تشغيل عمليات منصة مكتملة غير متماثلة.

## النموذج المرجعي

لدى Vercel Chat نموذج ذهني عام جيد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- طرق محول مثل `postMessage`، و`editMessage`، و`deleteMessage`،
  و`stream`، و`startTyping`، وجلب السجل
- محول حالة لإزالة التكرار، والأقفال، والطوابير، والاستمرارية

ينبغي أن يستعير OpenClaw المفردات، لا أن ينسخ السطح.

ما يحتاجه OpenClaw فوق ذلك النموذج:

- نيات إرسال صادرة دائمة قبل استدعاءات النقل المباشر.
- سياقات إرسال صريحة تتضمن البدء، والتثبيت، والفشل.
- سياقات استقبال تعرف سياسة الإقرار للمنصة.
- إيصالات تنجو من إعادة التشغيل ويمكنها قيادة التعديلات، والحذف، والاسترداد،
  ومنع التكرار.
- SDK عامة أصغر. يمكن للـ Plugins المضمنة استخدام مساعدات وقت التشغيل الداخلية، لكن
  يجب أن ترى الـ Plugins الخارجية واجهة برمجة رسائل واحدة متماسكة.
- سلوك خاص بالوكلاء: الجلسات، والنصوص، وبث الكتل، وتقدم الأدوات،
  والموافقات، وتوجيهات الوسائط، والردود الصامتة، وسجل الإشارات في المجموعات.

وعود نمط `thread.post()` ليست كافية لـ OpenClaw. فهي تخفي حد المعاملة
الذي يقرر ما إذا كان الإرسال قابلًا للاسترداد.

## النموذج المركزي

يجب أن يعيش النطاق الجديد تحت مساحة أسماء مركزية داخلية مثل
`src/channels/message/*`.

لديه أربعة مفاهيم:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

يمتلك `receive` دورة حياة الوارد.

يمتلك `send` دورة حياة الصادر.

يمتلك `live` حالة المعاينة، والتعديل، والتقدم، والبث.

تمتلك `state` تخزين النية الدائم، والإيصالات، والتماثل، والاسترداد، والأقفال،
وإزالة التكرار.

## مصطلحات الرسائل

### الرسالة

الرسالة المطبعة حيادية المنصة:

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

يصف الهدف المكان الذي تعيش فيه الرسالة:

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

الرد علاقة، وليس جذر API:

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

يسمح هذا لمسار الإرسال نفسه بالتعامل مع الردود العادية، وإشعارات Cron، ومطالبات الموافقة،
وإكمال المهام، وإرسالات أداة الرسائل، وإرسالات CLI أو واجهة التحكم، ونتائج الوكلاء الفرعيين،
وإرسالات الأتمتة.

### المنشأ

يصف المنشأ من أنتج رسالة وكيف يجب أن يتعامل OpenClaw مع أصداء
تلك الرسالة. وهو منفصل عن العلاقة: يمكن أن تكون الرسالة ردًا على مستخدم
وتظل مخرجًا تشغيليًا منشؤه OpenClaw.

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

يمتلك المركز معنى المخرجات ذات منشأ OpenClaw. وتمتلك القنوات كيفية
ترميز ذلك المنشأ في نقلها.

أول استخدام مطلوب هو مخرجات فشل Gateway. يجب أن يظل البشر يرون
رسائل مثل "فشل الوكيل قبل الرد" أو "مفتاح API مفقود"، لكن المخرجات
التشغيلية الموسومة من OpenClaw يجب ألا تُقبل كمدخلات مؤلفة بواسطة بوت في
الغرف المشتركة عندما يكون `allowBots` مفعلًا.

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

الإيصالات هي الجسر من النية الدائمة إلى التعديل المستقبلي، والحذف، وإنهاء المعاينة،
ومنع التكرار، والاسترداد.

يمكن أن يصف الإيصال رسالة منصة واحدة أو تسليمًا متعدد الأجزاء. يجب أن يحافظ
النص المجزأ، والوسائط مع النص، والصوت مع النص، وبدائل البطاقات على كل
معرفات المنصة مع الاستمرار في كشف معرف أساسي للتفريع والتعديلات اللاحقة.

## سياق الاستقبال

ينبغي ألا يكون الاستقبال استدعاء مساعد مجردًا. يحتاج المركز إلى سياق يعرف
إزالة التكرار، والتوجيه، وتسجيل الجلسة، وسياسة إقرار المنصة.

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

تدفق الاستقبال:

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

الإقرار ليس شيئًا واحدًا. يجب أن يُبقي عقد الاستقبال هذه الإشارات منفصلة:

- **إقرار النقل:** يخبر Webhook أو المقبس الخاص بالمنصة أن OpenClaw قبل
  غلاف الحدث. تتطلب بعض المنصات ذلك قبل الإرسال للمعالجة.
- **إقرار إزاحة الاستطلاع:** يقدّم مؤشرًا بحيث لا يُجلب الحدث نفسه
  مرة أخرى. يجب ألا يتقدم هذا بعد عمل لا يمكن استرداده.
- **إقرار سجل الوارد:** يؤكد أن OpenClaw ثبّت ما يكفي من بيانات تعريف الوارد
  لإزالة التكرار وتوجيه إعادة تسليم.
- **إيصال مرئي للمستخدم:** سلوك اختياري للقراءة/الحالة/الكتابة؛ لا يكون أبدًا
  حدًا للديمومة.

يتحكم `ReceiveAckPolicy` في إقرار النقل أو الاستطلاع فقط. يجب
ألا يُعاد استخدامه لإيصالات القراءة أو تفاعلات الحالة.

قبل تخويل البوت، يجب أن يطبق الاستقبال سياسة صدى OpenClaw المشتركة
عندما تستطيع القناة فك ترميز بيانات تعريف منشأ الرسالة:

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

هذا الإسقاط قائم على الوسم، لا على النص. لا تزال رسالة غرفة مؤلفة بواسطة بوت
بنص فشل Gateway المرئي نفسه لكن من دون بيانات تعريف منشأ OpenClaw تمر
عبر تخويل `allowBots` العادي.

سياسة الإقرار صريحة:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

يستخدم استطلاع Telegram الآن سياسة الإقرار لسياق الاستقبال للعلامة المائية
المستمرة لإعادة التشغيل. لا يزال المتتبع يراقب تحديثات grammY عند دخولها
سلسلة الوسطاء، لكن OpenClaw لا يثبت إلا معرف التحديث المكتمل الآمن بعد
الإرسال الناجح للمعالجة، تاركًا التحديثات الفاشلة أو الأدنى المعلقة قابلة لإعادة التشغيل
بعد إعادة التشغيل. لا تزال إزاحة جلب `getUpdates` upstream في Telegram
تُدار بواسطة مكتبة الاستطلاع، لذا فإن القطع الأعمق المتبقي هو مصدر استطلاع
دائم بالكامل إذا احتجنا إلى إعادة تسليم على مستوى المنصة بما يتجاوز علامة
إعادة التشغيل المائية الخاصة بـ OpenClaw. قد تحتاج منصات Webhook إلى إقرار
HTTP فوري، لكنها لا تزال تحتاج إلى إزالة تكرار الوارد ونوايا إرسال صادرة دائمة
لأن Webhooks يمكن أن تعيد التسليم.

## سياق الإرسال

الإرسال يعتمد أيضًا على السياق:

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

التنسيق المفضل:

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

يجب أن يكون القصد موجودًا قبل إدخال/إخراج النقل. يمكن التعافي من إعادة تشغيل بعد البدء ولكن قبل
التثبيت.

الحد الخطر يكون بعد نجاح المنصة وقبل تثبيت الإيصال. إذا انتهت العملية هناك، فلن يستطيع OpenClaw معرفة ما إذا كانت رسالة المنصة موجودة
إلا إذا وفر المهايئ عدم تكرار أصليًا أو مسار مطابقة إيصالات.
يجب أن تُستأنف تلك المحاولات في `unknown_after_send`، لا أن تُعاد عشوائيًا. قد تختار القنوات
التي لا تتضمن مطابقة إعادة إرسال بنمط مرة واحدة على الأقل فقط إذا كانت الرسائل المرئية المكررة
مقايضة مقبولة وموثقة لتلك القناة والعلاقة.
يتطلب جسر مطابقة SDK الحالي أن يصرح المهايئ بـ
`reconcileUnknownSend`، ثم يطلب من `durableFinal.reconcileUnknownSend`
تصنيف إدخال مجهول على أنه `sent` أو `not_sent` أو `unresolved`؛ ولا يسمح إلا `not_sent`
بإعادة الإرسال، وتبقى الإدخالات غير المحلولة نهائية أو تعيد فقط محاولة
فحص المطابقة.

يجب أن تكون سياسة الاستدامة صريحة:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

يعني `required` أن النواة يجب أن تفشل بإغلاق عندما لا تستطيع كتابة القصد المستدام.
يمكن لـ `best_effort` المتابعة عندما يكون الحفظ غير متاح. يحافظ `disabled` على
سلوك الإرسال المباشر القديم. أثناء الترحيل، تكون الأغلفة القديمة ومساعدات
التوافق العامة افتراضيًا على `disabled`؛ ويجب ألا تستنتج `required` من
مجرد أن قناة لديها مهايئ صادر عام.

تمتلك سياقات الإرسال أيضًا الآثار المحلية للقناة بعد الإرسال. لا يكون الترحيل آمنًا
إذا تجاوز التسليم المستدام سلوكًا محليًا كان مرتبطًا سابقًا
بمسار الإرسال المباشر للقناة. تشمل الأمثلة مخازن منع صدى الذات المؤقتة،
وعلامات المشاركة في السلاسل، ومرتكزات التحرير الأصلية، وعرض توقيع النموذج،
وحواجز منع التكرار الخاصة بالمنصة. يجب نقل تلك الآثار إما إلى
مهايئ الإرسال، أو مهايئ العرض، أو خطاف سياق إرسال مسمى قبل أن تتمكن تلك
القناة من تفعيل التسليم النهائي العام المستدام.

يجب أن تعيد مساعدات الإرسال الإيصالات طوال الطريق إلى مستدعيها. لا يمكن
للأغلفة المستدامة ابتلاع معرّفات الرسائل أو استبدال نتيجة تسليم قناة بـ
`undefined`؛ إذ تستخدم المرسلات المخزنة مؤقتًا تلك المعرّفات لمرتكزات السلاسل، والتحريرات اللاحقة،
وإنهاء المعاينات، ومنع التكرار.

تعمل الإرسالات الاحتياطية على دفعات، لا على حمولات مفردة. يمكن لإعادة كتابة الردود الصامتة،
والاحتياط للوسائط، والاحتياط للبطاقات، وإسقاط التقسيم أن تنتج جميعًا أكثر من
رسالة واحدة قابلة للتسليم، لذا يجب على سياق الإرسال إما تسليم الدفعة
المسقطة كاملة أو توثيق سبب صلاحية حمولة واحدة فقط بشكل صريح.

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

عندما يكون مثل هذا الاحتياط مستدامًا، يجب تمثيل الدفعة المسقطة كاملة
بقصد إرسال مستدام واحد أو خطة دفعة ذرية أخرى. تسجيل كل حمولة
واحدة تلو الأخرى ليس كافيًا: يمكن لانهيار بين الحمولات أن يترك احتياطًا مرئيًا جزئيًا
دون سجل مستدام للحمولات المتبقية. يجب أن يعرف التعافي
أي الوحدات لديها إيصالات بالفعل، وأن يعيد تشغيل الوحدات المفقودة فقط أو يضع علامة
على الدفعة كـ `unknown_after_send` حتى يطابقها المهايئ.

## السياق الحي

يجب أن تكون سلوكيات المعاينة، والتحرير، والتقدم، والبث دورة حياة اختيارية واحدة.

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

الحالة الحية مستدامة بما يكفي للتعافي أو منع التكرارات:

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

- إرسال Telegram مع تحرير المعاينة، وإرسال نهائي جديد بعد تقادم عمر المعاينة.
- إرسال Discord مع تحرير المعاينة، والإلغاء عند الوسائط/الخطأ/الرد الصريح.
- بث Slack الأصلي أو معاينة مسودة حسب شكل السلسلة.
- إنهاء منشور مسودة Mattermost.
- إنهاء حدث مسودة Matrix أو تنقيحه عند عدم التطابق.
- بث تقدم Teams الأصلي.
- بث QQ Bot أو احتياط متراكم.

## سطح المهايئ

يجب أن يكون هدف SDK العام مسارًا فرعيًا واحدًا:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

قبل تفويض الفحص المسبق، يجب على النواة تشغيل مسند صدى OpenClaw المشترك
كلما أعاد `origin.decode` بيانات وصفية ذات منشأ OpenClaw. يوفر مهايئ الاستقبال
حقائق المنصة مثل مؤلف البوت وشكل الغرفة؛ وتمتلك النواة قرار الإسقاط
والترتيب حتى لا تعيد القنوات تنفيذ مرشحات النص.

مهايئ المنشأ:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

تحدد النواة `MessageOrigin`. لا تفعل القنوات سوى ترجمته من وإلى
البيانات الوصفية الأصلية للنقل. يطابق Slack هذا إلى `chat.postMessage({ metadata })` و
`message.metadata` الواردة؛ ويمكن لـ Matrix مطابقته إلى محتوى حدث إضافي؛ أما القنوات
التي لا تملك بيانات وصفية أصلية فيمكنها استخدام سجل إيصالات/صادر عندما يكون ذلك
أفضل تقريب متاح.

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

## تقليل SDK العام

يجب أن يستوعب السطح العام الجديد هذه المجالات المفاهيمية أو يوقفها تدريجيًا:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- معظم الاستخدامات العامة لـ `outbound-runtime`
- مساعدات دورة حياة بث المسودات المخصصة

يمكن أن تبقى المسارات الفرعية للتوافق كأغلفة، لكن يجب ألا تحتاج إليها Plugins
الخارجية الجديدة.

قد تحتفظ Plugins المضمنة باستيرادات المساعدات الداخلية عبر مسارات فرعية محجوزة
لوقت التشغيل أثناء الترحيل. يجب أن توجه الوثائق العامة مؤلفي Plugins إلى
`plugin-sdk/channel-outbound` بمجرد وجوده.

## العلاقة مع الوارد للقنوات

`runtime.channel.inbound.*` هو جسر وقت التشغيل أثناء الترحيل.

يجب أن يصبح مهايئ توافق:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

يجب أن يبقى `channel.inbound.runPreparedReply` أيضًا مبدئيًا:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

تمت إزالة سطح وقت التشغيل القديم `channel.turn`. يستخدم مستدعو وقت التشغيل
`channel.inbound.*`؛ وتستخدم وثائق القنوات ومسارات SDK الفرعية أسماء الوارد/الرسائل.

## ضوابط التوافق

أثناء الترحيل، يكون التسليم العام المستدام اختياريًا لأي قناة يكون
استدعاء التسليم الحالي لديها ذا آثار جانبية تتجاوز "أرسل هذه الحمولة".

نقاط الدخول القديمة غير مستدامة افتراضيًا:

- يستخدم `channel.inbound.run` و `dispatchChannelInboundReply` استدعاء التسليم الخاص بالقناة
  إلا إذا قدمت تلك القناة صراحة كائن سياسة/خيارات مستدامة ومدققة.
- يبقى `channel.inbound.runPreparedReply` مملوكًا للقناة حتى يستدعي المرسل المحضر
  سياق الإرسال صراحة.
- لا تحقن مساعدات التوافق العامة مثل `recordInboundSessionAndDispatchReply`،
  و `dispatchInboundReplyWithBase`، ومساعدات الرسائل المباشرة أبدًا تسليمًا عامًا
  مستدامًا قبل استدعاء `deliver` أو `reply` المقدم من المستدعي.

بالنسبة إلى أنواع جسور الترحيل، تعني `durable: undefined` "غير مستدام". لا يتم
تفعيل المسار المستدام إلا بقيمة سياسة/خيارات صريحة. يمكن أن تبقى `durable:
false` كصياغة توافق، لكن يجب ألا يتطلب التنفيذ
من كل قناة غير مرَحّلة إضافتها.

يجب أن تبقي شيفرة الجسر الحالية قرار الاستدامة صريحًا:

- يعيد التسليم النهائي المتين حالة مميِّزة. يُعدّ `handled_visible` و
  `handled_no_send` حالتين نهائيتين؛ وقد يعود `unsupported` و `not_applicable`
  إلى التسليم المملوك للقناة؛ وينشر `failed` فشل الإرسال.
- يخضع التسليم النهائي المتين العام لإمكانات المحوّل، مثل
  التسليم الصامت، والحفاظ على هدف الرد، والحفاظ على الاقتباس الأصلي، وخطافات
  إرسال الرسائل. عند غياب التكافؤ، يجب اختيار التسليم المملوك للقناة،
  لا إرسال عام يغيّر السلوك المرئي للمستخدم.
- تعرض الإرسالات المتينة المدعومة بالطابور مرجع نية تسليم. يمكن لحقول الجلسة
  الحالية `pendingFinalDelivery*` حمل معرّف النية أثناء
  الانتقال؛ وتكون الحالة النهائية مخزن `MessageSendIntent` بدلا من نص
  رد مجمّد مع حقول سياق مرتجلة.

لا تفعّل المسار المتين العام لقناة حتى تكون كل هذه الشروط
صحيحة:

- ينفّذ محوّل الإرسال العام سلوك العرض والنقل نفسه الذي كان ينفذه
  المسار المباشر القديم.
- تُحفَظ الآثار الجانبية المحلية بعد الإرسال عبر سياق الإرسال.
- يعيد المحوّل إيصالات أو نتائج تسليم تتضمن كل معرّفات رسائل المنصة.
- إما أن تستدعي مسارات الموزّع المجهّزة سياق الإرسال الجديد، أو تبقى موثقة
  على أنها خارج ضمان المتانة.
- يعالج تسليم الرجوع كل حمولة متوقعة، وليس الحمولة الأولى فقط.
- يسجّل تسليم الرجوع المتين مصفوفة الحمولات المتوقعة كاملة كنية واحدة
  قابلة لإعادة التشغيل أو خطة دفعة.

مخاطر ترحيل ملموسة يجب الحفاظ عليها:

- يسجّل تسليم مراقب iMessage الرسائل المرسلة في ذاكرة صدى مؤقتة بعد
  إرسال ناجح. يجب أن تستمر الإرسالات النهائية المتينة في تعبئة تلك الذاكرة المؤقتة، وإلا
  فقد يعيد OpenClaw ابتلاع ردوده النهائية نفسها كرسائل مستخدم واردة.
- يضيف Tlon توقيع نموذج اختياري ويسجّل السلاسل التي تمت المشاركة فيها
  بعد ردود المجموعات. يجب ألا يتجاوز التسليم المتين العام هذه الآثار؛
  إما انقلها إلى محوّلات العرض/الإرسال/الإنهاء الخاصة بـ Tlon أو أبقِ Tlon على
  المسار المملوك للقناة.
- يملك Discord والموزّعون المجهّزون الآخرون بالفعل سلوك التسليم المباشر
  والمعاينة. ولا يشملهم ضمان المتانة للدورة المجمّعة حتى
  توجّه موزّعاتهم المجهّزة النهايات صراحة عبر سياق الإرسال.
- يجب أن يسلّم تسليم الرجوع الصامت في Telegram مصفوفة الحمولات المتوقعة
  كاملة. يمكن لاختصار حمولة واحدة أن يسقط حمولات رجوع إضافية بعد
  الإسقاط.
- قد تملك LINE وZalo وNostr وغيرها من المسارات المجمّعة/المساعدة الحالية
  معالجة رموز الرد، أو تمرير الوسائط عبر وكيل، أو ذاكرات تخزين مؤقت للرسائل المرسلة، أو تنظيف التحميل/الحالة،
  أو أهدافا مخصصة للاستدعاء فقط. تبقى هذه على التسليم المملوك للقناة حتى
  تمثَّل هذه الدلالات في محوّل الإرسال وتتحقق منها الاختبارات.
- يمكن أن تحتوي مساعدات الرسائل المباشرة على استدعاء رد يكون هو هدف النقل
  الصحيح الوحيد. يجب ألا يخمّن الإرسال العام الصادر من `OriginatingTo` أو `To` ويتجاوز
  ذلك الاستدعاء.
- يجب أن يبقى خرج فشل OpenClaw gateway مرئيا للبشر، لكن يجب إسقاط أصداء الغرف
  الموسومة والمؤلفة بواسطة بوت قبل تفويض `allowBots`.
  يجب ألا تنفذ القنوات هذا بمرشحات بادئة نصية مرئية إلا كإجراء
  إيقاف طارئ قصير؛ عقد المتانة هو بيانات وصفية منظمة للأصل.

## التخزين الداخلي

يجب أن يخزّن الطابور المتين نوايا إرسال الرسائل، لا حمولات الرد.

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
والسلسلة، والهدف، وسياسة التنسيق، وقواعد الوسائط بعد إعادة التشغيل.

## فئات الفشل

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
- لا تعد محاولة `invalid_payload` إلا إذا كان هناك رجوع عرض.
- لا تعد محاولة `auth` أو `permission` حتى يتغير الإعداد.
- بالنسبة إلى `not_found`، اسمح للإنهاء الحي بالرجوع من التحرير إلى إرسال جديد عندما
  تعلن القناة أن ذلك آمن.
- بالنسبة إلى `conflict`، استخدم قواعد الإيصال/الإديمبوتنسية لتحديد ما إذا كانت الرسالة
  موجودة بالفعل.
- أي خطأ بعد أن يكون المحوّل قد أكمل ربما إدخال/إخراج المنصة ولكن قبل تثبيت الإيصال
  يصبح `unknown_after_send` ما لم يستطع المحوّل إثبات أن عملية المنصة
  لم تحدث.

## تعيين القنوات

| القناة         | الترحيل المستهدف                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | تلقي سياسة الإقرار بالإضافة إلى عمليات إرسال نهائية متينة. يملك المحوّل المباشر الإرسال بالإضافة إلى تعديل المعاينة، والإرسال النهائي للمعاينة القديمة، والموضوعات، وتخطي معاينة الرد بالاقتباس، والرجوع الاحتياطي للوسائط، ومعالجة retry-after.                                                                                                                                                                   |
| Discord         | يغلّف محوّل الإرسال تسليم الحمولة المتينة الحالية. يملك المحوّل المباشر تعديل المسودة، ومسودة التقدم، وإلغاء معاينة الوسائط/الأخطاء، والحفاظ على هدف الرد، وإيصالات معرّفات الرسائل. راجع أصداء إخفاق Gateway المؤلفة من البوت في الغرف المشتركة؛ استخدم سجلًا صادرًا أو مكافئًا أصليًا آخر إذا كان Discord لا يستطيع حمل بيانات المنشأ الوصفية على الرسائل العادية. |
| Slack           | يتعامل محوّل الإرسال مع منشورات الدردشة العادية. يختار المحوّل المباشر البث الأصلي عندما يدعم شكل السلسلة ذلك، وإلا يستخدم معاينة المسودة. تحفظ الإيصالات طوابع وقت السلاسل. يربط محوّل المنشأ إخفاقات Gateway في OpenClaw إلى Slack `chat.postMessage.metadata` ويسقط أصداء غرف البوتات الموسومة قبل تفويض `allowBots`.                                  |
| WhatsApp        | يملك محوّل الإرسال إرسال النص/الوسائط مع نوايا نهائية متينة. يتعامل محوّل التلقي مع الإشارة إلى المجموعة وهوية المرسل. يمكن أن يبقى المحوّل المباشر غائبًا إلى أن يمتلك WhatsApp نقلًا قابلًا للتحرير.                                                                                                                                                                        |
| Matrix          | يملك المحوّل المباشر تعديلات أحداث المسودة، والإنهاء، والتنقيح، وقيود الوسائط المشفرة، والرجوع الاحتياطي عند عدم تطابق هدف الرد. يملك محوّل التلقي إماهة الأحداث المشفرة وإزالة التكرار. ينبغي أن يرمّز محوّل المنشأ منشأ إخفاق Gateway في OpenClaw ضمن محتوى حدث Matrix ويسقط أصداء غرف البوتات المكوّنة قبل معالجة `allowBots`.              |
| Mattermost      | يملك المحوّل المباشر منشور مسودة واحدًا، وطي التقدم/الأدوات، والإنهاء في الموضع، والرجوع الاحتياطي إلى إرسال جديد.                                                                                                                                                                                                                                                       |
| Microsoft Teams | يملك المحوّل المباشر التقدم الأصلي وسلوك بث الكتل. يملك محوّل الإرسال الأنشطة وإيصالات المرفقات/البطاقات.                                                                                                                                                                                                                                        |
| Feishu          | يملك محوّل العرض تصيير النص/البطاقة/الخام. يملك المحوّل المباشر بطاقات البث وكبت النهائي المكرر. يملك محوّل الإرسال التعليقات، وجلسات الموضوعات، والوسائط، وكبت الصوت.                                                                                                                                                                      |
| QQ Bot          | يملك المحوّل المباشر بث C2C، ومهلة المجمّع، والإرسال النهائي الاحتياطي. يملك محوّل العرض وسوم الوسائط وتحويل النص إلى صوت.                                                                                                                                                                                                                               |
| Signal          | تلقي بسيط بالإضافة إلى محوّل إرسال. لا محوّل مباشر إلا إذا أضاف signal-cli دعم تحرير موثوقًا.                                                                                                                                                                                                                                                                |
| iMessage        | تلقي بسيط بالإضافة إلى محوّل إرسال. يجب أن يحافظ إرسال iMessage على تعبئة ذاكرة صدى المراقب المؤقتة قبل أن تتمكن النهائيات المتينة من تجاوز تسليم المراقب.                                                                                                                                                                                                                 |
| Google Chat     | تلقي بسيط بالإضافة إلى محوّل إرسال مع ربط علاقة السلسلة بالمساحات ومعرّفات السلاسل. راجع سلوك غرفة `allowBots=true` لأصداء إخفاق Gateway في OpenClaw الموسومة.                                                                                                                                                                                        |
| LINE            | تلقي بسيط بالإضافة إلى محوّل إرسال مع نمذجة قيود رمز الرد كإمكان هدف/علاقة.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | جسر تلقي SDK بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                          |
| IRC             | تلقي بسيط بالإضافة إلى محوّل إرسال، من دون إيصالات تحرير متينة.                                                                                                                                                                                                                                                                                                    |
| Nostr           | تلقي بالإضافة إلى محوّل إرسال للرسائل المباشرة المشفرة؛ الإيصالات هي معرّفات الأحداث.                                                                                                                                                                                                                                                                                           |
| QA Channel      | محوّل اختبار عقد لسلوك التلقي، والإرسال، والبث المباشر، وإعادة المحاولة، والاسترداد.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | يجب أن يحافظ محوّل الإرسال على تصيير توقيع النموذج وتتبع السلاسل المشاركة قبل تمكين التسليم النهائي المتين العام.                                                                                                                                                                                                                        |
| Twitch          | تلقي بسيط بالإضافة إلى محوّل إرسال مع تصنيف حدود المعدل.                                                                                                                                                                                                                                                                                               |
| Zalo            | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | تلقي بسيط بالإضافة إلى محوّل إرسال.                                                                                                                                                                                                                                                                                                                              |

## خطة الترحيل

### المرحلة 1: نطاق الرسائل الداخلي

- أضف أنواع `src/channels/message/*` للرسائل، والأهداف، والعلاقات،
  والمناشئ، والإيصالات، والإمكانات، والنوايا المتينة، وسياق التلقي، وسياق الإرسال،
  والسياق المباشر، وفئات الإخفاق.
- أضف `origin?: MessageOrigin` إلى نوع حمولة جسر الترحيل الذي يستخدمه
  تسليم الرد الحالي، ثم انقل ذلك الحقل إلى `ChannelMessage` وأنواع الرسائل
  المصيّرة بينما تستبدل إعادة الهيكلة حمولات الرد.
- أبقِ هذا داخليًا حتى تثبت المحوّلات والاختبارات الشكل.
- أضف اختبارات وحدة صرفة لانتقالات الحالة والتسلسل.

### المرحلة 2: نواة الإرسال المتين

- انقل قائمة الانتظار الصادرة الحالية من متانة حمولة الرد إلى نوايا إرسال
  الرسائل المتينة.
- اسمح لنوايا الإرسال المتين بحمل مصفوفة حمولات مسقطة أو خطة دفعة، وليس
  حمولة رد واحدة فقط.
- حافظ على سلوك استرداد قائمة الانتظار الحالي عبر تحويل التوافق.
- اجعل `deliverOutboundPayloads` تستدعي `messages.send`.
- اجعل متانة الإرسال النهائي هي الافتراضية وافشل بصورة مغلقة عندما لا يمكن
  كتابة النية المتينة في دورة حياة الرسائل الجديدة، بعد أن يعلن المحوّل
  أمان إعادة التشغيل. تظل مسارات مشغّل الوارد الحالي وتوافق SDK إرسالًا مباشرًا
  افتراضيًا خلال هذه المرحلة.
- سجّل الإيصالات باتساق.
- أعد الإيصالات ونتائج التسليم إلى مستدعي المرسل الأصلي بدلًا من التعامل مع
  الإرسال المتين كأثر جانبي طرفي.
- استمر في حفظ منشأ الرسالة عبر نوايا الإرسال المتين حتى يحافظ الاسترداد،
  وإعادة التشغيل، وعمليات الإرسال المجزأة على المصدر التشغيلي لـ OpenClaw.

### المرحلة 3: جسر وارد القناة

- أعد تنفيذ `channel.inbound.run` و`dispatchChannelInboundReply` فوق
  `messages.receive` و`messages.send`.
- أبقِ أنواع الحقائق الحالية مستقرة.
- حافظ على السلوك القديم افتراضيًا. لا تصبح قناة الدور المجمّع متينة إلا
  عندما يختار محوّلها ذلك صراحةً بسياسة متانة آمنة لإعادة التشغيل.
- أبقِ `durable: false` كمخرج توافق للمسارات التي تنهي التحريرات الأصلية
  ولا يمكنها إعادة التشغيل بأمان بعد، لكن لا تعتمد على علامات `false`
  لحماية القنوات غير المرحّلة.
- فعّل متانة الدور المجمّع افتراضيًا فقط في دورة حياة الرسائل الجديدة، بعد
  أن يثبت ربط القناة أن مسار الإرسال العام يحافظ على دلالات تسليم القناة القديمة.

### المرحلة 4: جسر المرسل المحضّر

- استبدل `deliverDurableInboundReplyPayload` بجسر سياق إرسال.
- أبقِ المساعد القديم كغلاف.
- انقل Telegram وWhatsApp وSlack وSignal وiMessage وDiscord أولاً لأن
  لديها بالفعل عمل نهائي دائم أو مسارات إرسال أبسط.
- تعامل مع كل موزّع مُحضَّر على أنه غير مغطى حتى يختار صراحةً استخدام
  سياق الإرسال. يجب أن تقول الوثائق ومدخلات سجل التغييرات "دورات القناة
  المُجمَّعة" أو أن تسمّي مسارات القنوات المُرحَّلة بدلاً من الادعاء بكل
  الردود النهائية التلقائية.
- أبقِ سلوك `recordInboundSessionAndDispatchReply` ومساعدات الرسائل المباشرة
  ومساعدات التوافق العامة المشابهة محافظاً على السلوك. يمكنها أن تعرض لاحقاً
  اختياراً صريحاً لاستخدام سياق الإرسال، لكنها يجب ألا تحاول تلقائياً تنفيذ
  تسليم دائم عام قبل رد نداء التسليم المملوك للمتصل.

### المرحلة 5: دورة حياة مباشرة موحّدة

- ابنِ `messages.live` مع محوّلي إثبات:
  - Telegram للإرسال والتحرير والإرسال النهائي المتقادم.
  - Matrix لإنهاء المسودة مع بديل الحذف.
- ثم رحّل Discord وSlack وMattermost وTeams وQQ Bot وFeishu.
- احذف كود إنهاء المعاينة المكرر فقط بعد أن تحصل كل قناة على
  اختبارات تكافؤ.

### المرحلة 6: SDK العام

- أضف `openclaw/plugin-sdk/channel-outbound`.
- وثّقه بصفته API Plugin القناة المفضّل.
- حدّث صادرات الحزمة، وجرد نقاط الدخول، وخطوط أساس API المولّدة،
  ووثائق SDK الخاصة بالـPlugin.
- ضمّن `MessageOrigin`، وخطافات ترميز/فك ترميز الأصل، والمسند المشترك
  `shouldDropOpenClawEcho` في سطح SDK الخاص بـchannel-outbound.
- أبقِ أغلفة التوافق للمسارات الفرعية القديمة.
- علّم مساعدات SDK المسماة بالرد بأنها مهملة في الوثائق بعد ترحيل
  الـplugins المضمّنة.

### المرحلة 7: كل المرسلين

انقل كل منتجي الخرج غير الردّي إلى `messages.send`:

- إشعارات Cron وHeartbeat
- إكمالات المهام
- نتائج الخطافات
- مطالبات الموافقة ونتائج الموافقة
- عمليات إرسال أداة الرسائل
- إعلانات إكمال الوكلاء الفرعيين
- عمليات إرسال CLI أو Control UI الصريحة
- مسارات الأتمتة/البث

هنا يتوقف النموذج عن كونه "ردود الوكيل" ويصبح "OpenClaw يرسل
رسائل".

### المرحلة 8: إزالة التوافق المسمّى بالدورة

- أبقِ الأغلفة المسماة بالوارد/الرسائل كنافذة توافق.
- انشر ملاحظات الترحيل.
- شغّل اختبارات توافق SDK الخاص بالـPlugin ضد الاستيرادات القديمة.
- أزل أو أخفِ المساعدات الداخلية القديمة فقط بعد ألا يحتاج إليها أي Plugin
  مضمّن وأن تكون لعقود الجهات الخارجية بدائل مستقرة.

## خطة الاختبار

اختبارات الوحدات:

- تسلسل واسترداد نية الإرسال الدائم.
- إعادة استخدام مفتاح التماثل وكبح التكرارات.
- تثبيت الإيصال وتجاوز إعادة التشغيل.
- استرداد `unknown_after_send` الذي يوفّق قبل إعادة التشغيل عندما يدعم
  المحوّل التوفيق.
- سياسة تصنيف الإخفاقات.
- تسلسل سياسة إقرار الاستلام.
- تخطيط العلاقات لإرسالات الرد والمتابعة والنظام والبث.
- مصنع أصل إخفاق Gateway ومسند `shouldDropOpenClawEcho`.
- الحفاظ على الأصل عبر تطبيع الحمولة، والتقطيع، وتسلسل قائمة الانتظار
  الدائمة، والاسترداد.

اختبارات التكامل:

- ما يزال محوّل `channel.inbound.run` البسيط يسجل ويرسل.
- لا يصبح تسليم الحدث المُجمَّع القديم دائماً إلا إذا اختارت القناة ذلك
  صراحةً.
- ما يزال جسر `channel.inbound.runPreparedReply` يسجل وينهي.
- تستدعي مساعدات التوافق العامة ردود نداء التسليم المملوكة للمتصل افتراضياً
  ولا تنفّذ إرسالاً عاماً قبل تلك الردود.
- يعيد تسليم البديل الدائم تشغيل مصفوفة الحمولات المسقطة كلها بعد إعادة
  التشغيل، ولا يمكنه ترك الحمولات اللاحقة غير مسجلة بعد تعطل مبكر.
- يعيد تسليم الحدث المُجمَّع الدائم معرّفات رسائل المنصة إلى الموزّع
  المخزّن مؤقتاً.
- ما تزال خطافات التسليم المخصصة تعيد معرّفات رسائل المنصة عندما يكون
  التسليم الدائم معطلاً أو غير متاح.
- ينجو الرد النهائي من إعادة التشغيل بين اكتمال المساعد وإرسال المنصة.
- تُنهى مسودة المعاينة في مكانها عندما يكون ذلك مسموحاً.
- تُلغى مسودة المعاينة أو تُحذف عندما يتطلب عدم تطابق الوسائط/الخطأ/هدف
  الرد تسليماً عادياً.
- لا يسلّم بث الكتل وبث المعاينة النص نفسه معاً.
- لا تُكرر الوسائط التي بُثت مبكراً في التسليم النهائي.

اختبارات القنوات:

- رد موضوع Telegram مع تأخير إقرار الاستلام عبر الاقتراع حتى علامة الماء
  المكتملة الآمنة الخاصة بسياق الاستلام.
- استرداد اقتراع Telegram للتحديثات المقبولة لكن غير المسلّمة مغطى بنموذج
  الإزاحة الآمنة المكتملة المحفوظ.
- ترسل معاينة Telegram المتقادمة نتيجة نهائية جديدة وتنظف المعاينة.
- يرسل بديل Telegram الصامت كل حمولة بديلة مسقطة.
- تسجل ديمومة بديل Telegram الصامت مصفوفة البدائل المسقطة الكاملة ذرياً،
  وليس نية دائمة ذات حمولة واحدة لكل تكرار في الحلقة.
- إلغاء معاينة Discord عند وجود وسائط/خطأ/رد صريح.
- تمر نهائيات موزّع Discord المُحضَّر عبر سياق الإرسال قبل أن تزعم الوثائق
  أو سجل التغييرات ديمومة الرد النهائي في Discord.
- تملأ الإرسالات النهائية الدائمة في iMessage ذاكرة التخزين المؤقتة لصدى
  الرسالة المرسلة في المراقب.
- لا تتجاوز مسارات التسليم القديمة في LINE وZalo وNostr بالإرسال الدائم
  العام حتى توجد اختبارات تكافؤ لمحوّلاتها.
- يبقى تسليم رد النداء الخاص بالرسائل المباشرة/Nostr هو المرجع ما لم يُرحَّل
  صراحةً إلى هدف رسالة كامل ومحوّل إرسال آمن لإعادة التشغيل.
- تبقى رسائل إخفاق Gateway الموسومة من Slack وOpenClaw مرئية في الخرج،
  وتسقط أصداء غرف البوتات الموسومة قبل `allowBots`، وتظل رسائل البوتات غير
  الموسومة ذات النص المرئي نفسه تتبع تفويض البوت العادي.
- بديل البث الأصلي في Slack إلى معاينة مسودة في الرسائل المباشرة ذات المستوى
  الأعلى.
- إنهاء معاينة Matrix وبديل الحذف.
- تسقط أصداء غرف إخفاق Gateway الموسومة من Matrix وOpenClaw من حسابات البوتات
  المضبوطة قبل معالجة `allowBots`.
- تغطي تدقيقات سلسلة إخفاق Gateway في الغرف المشتركة بين Discord وGoogle Chat
  أوضاع `allowBots` قبل ادعاء الحماية العامة هناك.
- إنهاء مسودة Mattermost وبديل الإرسال الجديد.
- إنهاء تقدم Teams الأصلي.
- كبح النهائي المكرر في Feishu.
- بديل مهلة مُجمِّع QQ Bot.
- تحافظ الإرسالات النهائية الدائمة في Tlon على عرض توقيع النموذج وتتبع
  السلاسل التي تمت المشاركة فيها.
- إرسالات نهائية دائمة بسيطة في WhatsApp وSignal وiMessage وGoogle Chat وLINE
  وIRC وNostr وNextcloud Talk وSynology Chat وTlon وTwitch وZalo وZalo Personal.

التحقق:

- ملفات Vitest مستهدفة أثناء التطوير.
- `pnpm check:changed` في Testbox لكامل السطح المتغير.
- `pnpm check` أوسع في Testbox قبل إنزال إعادة الهيكلة الكاملة أو بعد
  تغييرات SDK/التصدير العامة.
- تجربة دخان مباشرة أو qa-channel لقناة واحدة على الأقل قادرة على التحرير
  وقناة واحدة بسيطة مخصصة للإرسال فقط قبل إزالة أغلفة التوافق.

## أسئلة مفتوحة

- ما إذا كان ينبغي لـTelegram في النهاية استبدال مصدر مشغّل grammY بمصدر
  اقتراع دائم بالكامل يمكنه التحكم في إعادة التسليم على مستوى المنصة، وليس
  فقط علامة ماء إعادة التشغيل المحفوظة في OpenClaw.
- ما إذا كان يجب تخزين حالة المعاينة المباشرة الدائمة في سجل قائمة الانتظار
  نفسه مثل نية الإرسال النهائي أم في مخزن حالة مباشرة شقيق.
- مدة بقاء أغلفة التوافق موثقة بعد شحن `plugin-sdk/channel-outbound`.
- ما إذا كان ينبغي للـplugins التابعة لجهات خارجية تنفيذ محوّلات الاستلام
  مباشرة أم تقديم خطافات التطبيع/الإرسال/المباشر فقط عبر
  `defineChannelMessageAdapter`.
- أي حقول الإيصالات آمنة للعرض في SDK العام مقارنة بحالة وقت التشغيل الداخلية.
- ما إذا كان يجب نمذجة الآثار الجانبية مثل ذاكرات صدى الذات المؤقتة وعلامات
  السلاسل التي تمت المشاركة فيها كخطافات سياق إرسال، أو خطوات إنهاء مملوكة
  للمحوّل، أو مشتركين في الإيصالات.
- أي القنوات لديها بيانات تعريف أصل أصلية، وأيها تحتاج سجلات خرج محفوظة،
  وأيها لا يمكنه تقديم كبح موثوق للصدى بين البوتات.

## معايير القبول

- ترسل كل قناة رسائل مضمّنة الخرج النهائي المرئي عبر `messages.send`.
- تدخل كل قناة رسائل واردة عبر `messages.receive` أو غلاف توافق موثق.
- تستخدم كل قناة معاينة/تحرير/بث `messages.live` لحالة المسودة والإنهاء.
- `channel.inbound` ليس إلا غلافاً.
- مساعدات SDK المسماة بالرد هي صادرات توافق، وليست المسار الموصى به.
- يستطيع الاسترداد الدائم إعادة تشغيل الإرسالات النهائية المعلقة بعد إعادة
  التشغيل دون فقدان الرد النهائي أو تكرار الإرسالات المثبتة مسبقاً؛ وتُوفَّق
  الإرسالات التي تكون نتيجتها على المنصة غير معروفة قبل إعادة التشغيل أو
  توثَّق على أنها مرة واحدة على الأقل لذلك المحوّل.
- تفشل الإرسالات النهائية الدائمة بشكل مغلق عندما لا يمكن كتابة النية
  الدائمة، ما لم يختر المتصل صراحةً وضعاً غير دائم موثقاً.
- تعود مساعدات توافق SDK القديمة افتراضياً إلى التسليم المباشر المملوك
  للقناة؛ ولا يكون الإرسال الدائم العام إلا اختياراً صريحاً.
- تحفظ الإيصالات كل معرّفات رسائل المنصة للتسليمات متعددة الأجزاء ومعرّفاً
  أساسياً لتسهيل السلاسل/التحرير.
- تحافظ الأغلفة الدائمة على الآثار الجانبية المحلية للقناة قبل استبدال
  ردود نداء التسليم المباشرة.
- لا تُحسب الموزّعات المُحضَّرة كدائمة حتى يستخدم مسار التسليم النهائي الخاص
  بها سياق الإرسال صراحةً.
- يتعامل تسليم البديل مع كل حمولة مسقطة.
- يسجل تسليم البديل الدائم كل حمولة مسقطة في نية واحدة قابلة لإعادة التشغيل
  أو خطة دفعات.
- يكون خرج إخفاق Gateway الصادر من OpenClaw مرئياً للبشر، لكن أصداء الغرف
  الموسومة والمكتوبة بواسطة البوتات تسقط قبل تفويض البوت على القنوات التي
  تعلن دعم عقد الأصل.
- تشرح الوثائق الإرسال، والاستلام، والمباشر، والحالة، والإيصالات، والعلاقات،
  وسياسة الإخفاق، والترحيل، وتغطية الاختبار.

## ذو صلة

- [الرسائل](/ar/concepts/messages)
- [البث والتقطيع](/ar/concepts/streaming)
- [مسودات التقدم](/ar/concepts/progress-drafts)
- [سياسة إعادة المحاولة](/ar/concepts/retry)
- [API وارد القناة](/ar/plugins/sdk-channel-inbound)

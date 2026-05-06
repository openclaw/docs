---
read_when:
    - أنت تبني أو تعيد هيكلة Plugin لقناة مراسلة
    - تحتاج إلى تسليم موثوق للرد النهائي، أو إيصالات استلام، أو إنهاء المعاينة المباشرة، أو سياسة إقرار بالاستلام
    - تقوم بالترحيل من مسار معالجة الردود القديم أو من مساعدات توجيه الردود الواردة
summary: واجهة برمجة تطبيقات دورة حياة الرسائل لـ Plugin القنوات، بما في ذلك عمليات الإرسال المتينة، والإيصالات، والمعاينة المباشرة، وسياسة إقرار الاستلام عند التلقي، وترحيل الأنظمة القديمة
title: واجهة برمجة تطبيقات رسائل القناة
x-i18n:
    generated_at: "2026-05-06T08:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

ينبغي أن تعرض Plugins القنوات محول `message` واحدًا من
`openclaw/plugin-sdk/channel-message`. يصف المحول دورة حياة الرسالة الأصلية
التي تدعمها المنصة:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

يمتلك المركز الانتظار في الطابور، والمتانة، وسياسة إعادة المحاولة العامة، والخطافات، والإيصالات، وأداة
`message` المشتركة. ويمتلك Plugin استدعاءات الإرسال/التحرير/الحذف الأصلية، وتطبيع الهدف، وسلاسل محادثات المنصة، والاقتباسات المحددة، وأعلام الإشعارات، وحالة الحساب، والآثار الجانبية الخاصة بالمنصة.

استخدم هذه الصفحة مع [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins).

المسار الفرعي `channel-message` خفيف عمدًا بما يكفي لملفات تمهيد Plugin الساخنة
مثل `channel.ts`: فهو يعرض عقود المحولات، وإثباتات القدرات، والإيصالات، وواجهات التوافق من دون تحميل التسليم الصادر.
تتوفر مساعدات التسليم وقت التشغيل من
`openclaw/plugin-sdk/channel-message-runtime` لمسارات تعليمات المراقبة/الإرسال البرمجية التي تنفذ بالفعل عمليات إدخال/إخراج رسائل غير متزامنة.

## المحول الأدنى

يمكن لمعظم Plugins القنوات الجديدة البدء بمحول صغير:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

ثم أرفقه بـ Plugin القناة:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

لا تعلن إلا القدرات التي يحافظ عليها المحول فعلًا. يجب أن يكون لكل قدرة معلنة اختبار عقد.

## جسر الصادر

إذا كانت القناة تملك بالفعل محول `outbound` متوافقًا، ففضّل اشتقاق محول الرسائل بدلًا من تكرار تعليمات الإرسال البرمجية:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

يحوّل الجسر نتائج الإرسال الصادر القديمة إلى قيم `MessageReceipt`. ينبغي أن تمرر التعليمات البرمجية الجديدة الإيصالات من البداية إلى النهاية، وألا تشتق المعرفات القديمة إلا عند حواف التوافق باستخدام
`listMessageReceiptPlatformIds(...)` أو
`resolveMessageReceiptPrimaryId(...)`.
إذا لم تُقدَّم سياسة استقبال، يستخدم `createChannelMessageAdapterFromOutbound(...)`
سياسة إقرار استقبال `manual`. يجعل ذلك إقرار المنصة المملوك لـ Plugin صريحًا من دون تغيير القنوات التي تقر Webhook أو المقابس أو إزاحات الاستطلاع خارج سياق الاستقبال العام.

## عمليات الإرسال عبر أداة الرسائل

ينبغي أن يستخدم مسار `message(action="send")` المشترك دورة حياة التسليم المركزية نفسها مثل الردود النهائية. إذا كانت القناة تحتاج إلى تشكيل خاص بمزود لعملية إرسال الأداة، فنفّذ `actions.prepareSendPayload(...)` بدلًا من الإرسال من
`actions.handleAction(...)`.

يتلقى `prepareSendPayload(...)` قيمة `ReplyPayload` المركزية المطَبَّعة مع سياق الإجراء الكامل. أرجع حمولة تتضمن بيانات خاصة بالقناة في
`payload.channelData.<channel>` ودع المركز يستدعي `sendMessage(...)` و
`deliverOutboundPayloads(...)` وطابور الكتابة المسبقة وخطافات إرسال الرسائل وإعادة المحاولة والاسترداد وتنظيف الإقرار.

لا تُرجع `null` إلا عندما لا يمكن تمثيل الإرسال كحمولة متينة، مثلًا لأنه يحتوي على مصنع مكونات غير قابل للتسلسل. سيبقي المركز على الرجوع القديم إلى إجراء Plugin من أجل التوافق، لكن ينبغي أن تكون ميزات إرسال القنوات الجديدة قابلة للتعبير عنها كبيانات حمولة متينة.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

ثم يقرأ محول الصادر `payload.channelData.demo` داخل `sendPayload`.
يبقي هذا العرض الخاص بالمنصة داخل Plugin بينما يظل المركز يمتلك الاستمرار وإعادة المحاولة والاسترداد والخطافات والإقرار.

تستخدم حمولات `message(action="send")` المحضّرة وتسليم الرد النهائي العام التسليم المركزي مع الانتظار في الطابور بأفضل جهد افتراضيًا. لا يصح اشتراط الانتظار المتين في الطابور إلا بعد أن يتحقق المركز من أن القناة تستطيع تسوية إرسال تكون نتيجته مجهولة بعد تعطل. إذا لم يستطع المحول تنفيذ `reconcileUnknownSend`، فأبقِ مسار الإرسال المحضّر بأفضل جهد؛ سيظل المركز يحاول استخدام طابور الكتابة المسبقة، لكن استمرار الطابور أو استرداد الأعطال غير المؤكد ليسا جزءًا من عقد التسليم المطلوب.

## قدرات النهائي المتين

تسليم النهائي المتين اختياري لكل أثر جانبي. لن يستخدم المركز التسليم المتين العام إلا عندما يعلن المحول كل قدرة تحتاج إليها الحمولة وخيارات التسليم.

| القدرة                 | أعلنها عندما                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | يستطيع المحول إرسال نص وإرجاع إيصال.                                      |
| `media`                | تُرجع عمليات إرسال الوسائط إيصالات لكل رسالة مرئية في المنصة.                      |
| `payload`              | يحافظ المحول على دلالات حمولة الرد الغنية، لا على النص وعنوان URL واحد لوسائط فقط. |
| `replyTo`              | تصل أهداف الرد الأصلية إلى المنصة.                                             |
| `thread`               | تصل أهداف السلسلة أو الموضوع أو سلسلة القناة الأصلية إلى المنصة.                  |
| `silent`               | يصل كتم الإشعارات إلى المنصة.                                       |
| `nativeQuote`          | تصل بيانات تعريف الاقتباس المحدد إلى المنصة.                                        |
| `messageSendingHooks`  | يمكن لخطافات إرسال الرسائل المركزية إلغاء المحتوى أو إعادة كتابته قبل إدخال/إخراج المنصة.        |
| `batch`                | يمكن إعادة تشغيل الدُفعات المعروضة متعددة الأجزاء كخطة متينة واحدة.                      |
| `reconcileUnknownSend` | يستطيع المحول حل استرداد `unknown_after_send` من دون إعادة تشغيل عمياء.          |
| `afterSendSuccess`     | تعمل الآثار الجانبية المحلية للقناة بعد الإرسال مرة واحدة.                                      |
| `afterCommit`          | تعمل الآثار الجانبية المحلية للقناة بعد الالتزام مرة واحدة.                                    |

لا يتطلب التسليم النهائي بأفضل جهد `reconcileUnknownSend`؛ فهو يستخدم دورة الحياة المشتركة عندما يحافظ المحول على الدلالات المرئية للحمولة، ويرجع إلى إدخال/إخراج المنصة المباشر إذا لم يكن استمرار الطابور متاحًا. يجب أن يتطلب التسليم النهائي المتين المطلوب `reconcileUnknownSend` صراحة. إذا لم يستطع المحول تحديد ما إذا كان إرسال بدأ/مجهول قد وصل إلى المنصة، فلا تعلن تلك القدرة؛ سيرفض المركز التسليم المتين المطلوب قبل الانتظار في الطابور.

عندما يحتاج مستدعٍ إلى تسليم متين، اشتق المتطلبات بدلًا من بناء الخرائط يدويًا:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

يكون `messageSendingHooks` مطلوبًا افتراضيًا. اضبط `messageSendingHooks: false`
فقط لمسار لا يمكنه عمدًا تشغيل خطافات إرسال الرسائل العامة.

## عقد الإرسال المتين

للإرسال النهائي المتين دلالات أكثر صرامة من التسليم القديم المملوك للقناة:

- أنشئ نية متينة قبل إدخال/إخراج المنصة.
- إذا أعاد التسليم المتين نتيجة معالجة، فلا ترجع إلى الإرسال القديم.
- عُد إلغاء الخطاف ونتائج عدم الإرسال نتائج نهائية.
- عُد `unsupported` نتيجة قبل النية فقط.
- عند اشتراط المتانة، افشل قبل إدخال/إخراج المنصة إذا لم يستطع الطابور تسجيل أن إرسال المنصة قد بدأ.
- للتسليم النهائي المطلوب وعمليات إرسال أداة الرسائل المحضّرة المطلوبة،
  افحص `reconcileUnknownSend` مسبقًا؛ يجب أن يكون الاسترداد قادرًا على إقرار رسالة أُرسلت بالفعل أو إعادة التشغيل فقط بعد أن يثبت المحول أن الإرسال الأصلي لم يحدث.
- بالنسبة إلى `best_effort`، قد ترجع إخفاقات كتابة الطابور إلى إدخال/إخراج المنصة المباشر.
- مرّر إشارات الإجهاض إلى تحميل الوسائط وعمليات إرسال المنصة.
- شغّل خطافات ما بعد الالتزام بعد إقرار الطابور؛ يشغّلها الرجوع المباشر بأفضل جهد بعد نجاح إدخال/إخراج المنصة لأنه لا يوجد التزام طابور متين.
- أرجع إيصالات لكل معرف رسالة مرئية في المنصة.
- استخدم `reconcileUnknownSend` عندما تستطيع المنصة التحقق مما إذا كان إرسال غير مؤكد قد وصل بالفعل إلى المستخدم.

يتجنب هذا العقد عمليات الإرسال المكررة بعد الأعطال، ويتجنب تجاوز خطافات إلغاء إرسال الرسائل.

## الإيصالات

`MessageReceipt` هو السجل الداخلي الجديد لما قبلته المنصة:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

استخدم `createMessageReceiptFromOutboundResults(...)` عند تكييف نتيجة إرسال موجودة.
استخدم `createPreviewMessageReceipt(...)` عندما تصبح رسالة المعاينة المباشرة الإيصال النهائي. تجنب إضافة حقول `messageIds` محلية جديدة للمالك.
لا يزال `ChannelDeliveryResult.messageIds` القديم يُنتَج عند حواف التوافق.

## المعاينة المباشرة

ينبغي للقنوات التي تبث معاينات مسودة أو تحديثات تقدم أن تعلن القدرات المباشرة:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

استخدم `defineFinalizableLivePreviewAdapter(...)` و
`deliverWithFinalizableLivePreviewAdapter(...)` لإنهاء المعاينة وقت التشغيل. يقرر المُنهي ما إذا كان الرد النهائي يحرر المعاينة في مكانها، أو يرسل رجوعًا عاديًا، أو يتجاهل حالة المعاينة المعلقة، أو يبقي تحريرًا فاشلًا ملتبسًا من دون تكرار الرسالة، ويعيد الإيصال النهائي.

## سياسة إقرار الاستقبال

ينبغي للمستقبلات الواردة التي تتحكم في توقيت إقرار المنصة أن تعلن سياسة الاستقبال:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

المحولات التي لا تعلن سياسة استقبال تُعيَّن افتراضيًا إلى:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

استخدم الإعداد الافتراضي عندما لا تملك المنصة إقرارًا لتأجيله، أو عندما تُقرّ قبل المعالجة غير المتزامنة، أو عندما تحتاج إلى دلالات استجابة خاصة بالبروتوكول. لا تُعلن إحدى السياسات المرحلية إلا عندما يستخدم المستقبل فعليًا سياق الاستقبال لنقل إقرار المنصة إلى وقت لاحق.

السياسات:

| السياسة                | استخدمها عندما                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | يمكن الإقرار للمنصة بعد تحليل الحدث الوارد وتسجيله.                                      |
| `after_agent_dispatch` | يجب أن تنتظر المنصة إلى أن يتم قبول إرسال الوكيل.                                        |
| `after_durable_send`   | يجب أن تنتظر المنصة إلى أن يكون للتسليم النهائي قرار دائم.                               |
| `manual`               | يملك Plugin الإقرار لأن دلالات المنصة لا تطابق مرحلة عامة.                               |

استخدم `createMessageReceiveContext(...)` في المستقبلات التي تؤجل حالة الإقرار، و
`shouldAckMessageAfterStage(...)` عندما يحتاج المستقبل إلى اختبار ما إذا كانت
مرحلة ما قد استوفت السياسة المكوّنة.

## اختبارات العقد

تصريحات الإمكانات جزء من عقد Plugin. ادعمها بالاختبارات:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

أضف مجموعات إثبات للبث المباشر والاستقبال عندما يعلن المحوّل تلك الميزات. يجب
أن يؤدي غياب الإثبات إلى فشل الاختبار بدلًا من توسيع السطح الدائم بصمت.

## واجهات API للتوافق المهجورة

تبقى واجهات API هذه قابلة للاستيراد من أجل توافق الجهات الخارجية. لا تستخدمها في
كود القنوات الجديد.

| واجهة API المهجورة                         | البديل                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` لمرسلات التوافق، أو محوّل `message` لكود القنوات الجديد                  |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` من `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` لمرسلات التوافق فقط                                                     |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` لمرسلات التوافق فقط                                                       |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` مع `deliverWithFinalizableLivePreviewAdapter(...)`                      |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

لا يزال بإمكان مرسلات التوافق استخدام `createReplyPrefixContext(...)`،
`createReplyPrefixOptions(...)`، و`createTypingCallbacks(...)` عبر واجهة الرسائل.
يجب أن يتجنب كود دورة الحياة الجديد المسار الفرعي القديم
`channel-reply-pipeline`.

## قائمة تحقق الترحيل

1. أضف `message: defineChannelMessageAdapter(...)` أو
   `message: createChannelMessageAdapterFromOutbound(...)` إلى Plugin القناة.
2. أرجع `MessageReceipt` من عمليات إرسال النصوص والوسائط والحمولات.
3. أعلن فقط الإمكانات المدعومة بسلوك أصلي واختبارات.
4. استبدل خرائط المتطلبات الدائمة المكتوبة يدويًا بـ
   `deriveDurableFinalDeliveryRequirements(...)`.
5. انقل إنهاء المعاينة عبر مساعدات المعاينة المباشرة عندما تعدّل القناة رسائل المسودة في مكانها.
6. أعلن سياسة إقرار الاستقبال فقط عندما يستطيع المستقبل فعلًا تأجيل إقرار المنصة.
7. احتفظ بمساعدات إرسال الردود القديمة عند أطراف التوافق فقط.

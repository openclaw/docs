---
read_when:
    - أنت تبني Plugin لقناة مراسلة أو تعيد هيكلته
    - تحتاج إلى تسليم دائم للرد النهائي، أو إيصالات، أو إنهاء المعاينة الحية، أو سياسة إقرار الاستلام
    - إذا كنت تنتقل من مسار معالجة الردود القديم أو دوال المساعدة لتوجيه الردود الواردة
summary: API دورة حياة الرسائل لـ Plugins القنوات، بما في ذلك عمليات الإرسال الدائمة، والإيصالات، والمعاينة المباشرة، وسياسة إقرار الاستلام، والترحيل من الأنظمة القديمة
title: واجهة برمجة تطبيقات رسائل القنوات
x-i18n:
    generated_at: "2026-05-10T19:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

ينبغي أن تكشف Plugins القنوات عن محوّل `message` واحد من
`openclaw/plugin-sdk/channel-message`. يصف المحوّل دورة حياة الرسالة الأصلية
التي تدعمها المنصة:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

يمتلك القلب الاصطفاف، والمتانة، وسياسة إعادة المحاولة العامة، والخطافات، والإيصالات، وأداة
`message` المشتركة. ويمتلك Plugin استدعاءات الإرسال/التحرير/الحذف الأصلية، وتطبيع الهدف،
وترابط المنصة، والاقتباسات المحددة، وأعلام الإشعارات، وحالة الحساب، والآثار الجانبية الخاصة بالمنصة.

استخدم هذه الصفحة مع [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins).

المسار الفرعي `channel-message` مصمم عمدا ليكون خفيفا بما يكفي لملفات تهيئة Plugin الساخنة
مثل `channel.ts`: فهو يكشف عقود المحوّلات، وإثباتات القدرات، والإيصالات، وواجهات التوافق
من دون تحميل التسليم الصادر. تتوفر مساعدات التسليم وقت التشغيل من
`openclaw/plugin-sdk/channel-message-runtime` لمسارات كود المراقبة/الإرسال التي
تنفذ فعلا إدخال/إخراج رسائل غير متزامن.

ينبغي أن يستخدم كود إرسال القنوات وPlugins الجديد مساعدات دورة حياة الرسائل من
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`،
`withDurableMessageSendContext`، أو `deliverInboundReplyWithMessageSendContext`.
أما المساعد الأقدم
`deliverOutboundPayloads(...)` في `openclaw/plugin-sdk/outbound-runtime`
فهو طبقة توافق/وقت تشغيل مهملة للاستخدامات الداخلية الصادرة، والاسترداد،
والمحوّلات القديمة. لا تستخدمه في مسارات إرسال القنوات أو Plugins الجديدة.

يعيد `sendDurableMessageBatch(...)` نتيجة دورة حياة صريحة:

- `sent` - تم تسليم رسالة منصة مرئية واحدة على الأقل.
- `suppressed` - لا ينبغي التعامل مع غياب رسالة منصة على أنه نقص. تشمل الأسباب الثابتة
  `cancelled_by_message_sending_hook`،
  `empty_after_message_sending_hook`، و`no_visible_payload`،
  و`adapter_returned_no_identity`، و`no_visible_result` القديم.
- `partial_failed` - تم تسليم رسالة منصة واحدة على الأقل قبل فشل حمولة لاحقة
  أو أثر جانبي لاحق. تتضمن النتيجة بادئة الإيصال المسلّمة بالإضافة إلى الفشل.
- `failed` - لم يتم إنتاج أي إيصال منصة.

استخدم `payloadOutcomes` عندما تمزج الدفعة بين حمولات مرسلة، ومكبوتة، وفاشلة.
لا تستنتج إلغاء الخطاف عبر التحقق مما إذا كانت مصفوفة التسليم المباشر القديمة فارغة.

ينبغي لمرسلات التوافق التي ما زالت تحتاج إلى مرسل الردود المخزنة مؤقتا
بناء خيارات بادئة الرد باستخدام `createChannelMessageReplyPipeline(...)` من
`openclaw/plugin-sdk/channel-message`، ثم استدعاء
`channel.turn.runPrepared(...)` الخاص بوقت التشغيل. يحافظ ذلك على تسجيل الجلسة وترتيب الإرسال
ضمن دورة حياة الدور المشتركة من دون إضافة غلاف دور عام آخر.

## المحوّل الأدنى

يمكن لمعظم Plugins القنوات الجديدة البدء بمحوّل صغير:

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

صرّح فقط بالقدرات التي يحافظ عليها المحوّل فعليا. ينبغي أن يكون لكل قدرة مصرّح بها
اختبار عقد.

## جسر الصادر

إذا كانت القناة تملك بالفعل محوّل `outbound` متوافقا، ففضّل اشتقاق محوّل
الرسائل بدلا من تكرار كود الإرسال:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

يحوّل الجسر نتائج الإرسال الصادرة القديمة إلى قيم `MessageReceipt`. ينبغي للكود الجديد
تمرير الإيصالات من البداية إلى النهاية، واشتقاق المعرّفات القديمة فقط عند حواف التوافق
باستخدام `listMessageReceiptPlatformIds(...)` أو
`resolveMessageReceiptPrimaryId(...)`.
إذا لم يتم توفير سياسة استقبال، يستخدم `createChannelMessageAdapterFromOutbound(...)`
سياسة إقرار استقبال `manual`. يجعل ذلك إقرار المنصة المملوك لـ Plugin صريحا
من دون تغيير القنوات التي تقر Webhooks، أو المقابس، أو إزاحات الاستطلاع خارج سياق الاستقبال العام.

## إرسالات أداة الرسائل

ينبغي أن يستخدم مسار `message(action="send")` المشترك دورة حياة التسليم الأساسية نفسها
المستخدمة في الردود النهائية. إذا احتاجت قناة إلى تشكيل خاص بالمزوّد لإرسال الأداة،
فنفّذ `actions.prepareSendPayload(...)` بدلا من الإرسال من
`actions.handleAction(...)`.

يتلقى `prepareSendPayload(...)` حمولة `ReplyPayload` الأساسية المطّبعة بالإضافة إلى
سياق الإجراء الكامل. أعد حمولة تتضمن بيانات خاصة بالقناة في
`payload.channelData.<channel>` ودع القلب يستدعي `sendMessage(...)`،
ووقت تشغيل دورة حياة الرسائل، وطابور الكتابة المسبقة، وخطافات إرسال الرسائل،
وإعادة المحاولة، والاسترداد، وتنظيف الإقرار. قد يستدعي وقت تشغيل دورة الحياة
`deliverOutboundPayloads(...)` داخليا كطبقة توافق، لكن ينبغي ألا تستدعيه
Plugins القنوات مباشرة لسلوك إرسال جديد.

أعد `null` فقط عندما يتعذر تمثيل الإرسال كحمولة متينة، على سبيل المثال
لأنه يحتوي على مصنع مكوّن غير قابل للتسلسل. سيبقي القلب على الرجوع إلى إجراء Plugin القديم
للتوافق، لكن ينبغي التعبير عن ميزات إرسال القنوات الجديدة كبيانات حمولة متينة.

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

يقرأ محوّل الصادر بعد ذلك `payload.channelData.demo` داخل `sendPayload`.
يبقي هذا العرض الخاص بالمنصة داخل Plugin بينما يظل القلب مالكا للاستمرار،
وإعادة المحاولة، والاسترداد، والخطافات، والإقرار.

تستخدم حمولات `message(action="send")` المحضّرة وتسليم الرد النهائي العام
التسليم الأساسي مع الاصطفاف بأفضل جهد افتراضيا. لا يكون الاصطفاف المتين المطلوب
صالحا إلا بعد أن يتحقق القلب من أن القناة تستطيع التوفيق بين إرسال تكون نتيجته
غير معروفة بعد تعطل. إذا لم يستطع المحوّل تنفيذ `reconcileUnknownSend`،
فأبق مسار الإرسال المحضّر بأفضل جهد؛ سيظل القلب يحاول طابور الكتابة المسبقة،
لكن استمرار الطابور أو استرداد التعطل غير المؤكد ليس جزءا من عقد التسليم المطلوب.

## قدرات التسليم النهائي المتين

التسليم النهائي المتين اختياري لكل أثر جانبي. لن يستخدم القلب التسليم المتين العام
إلا عندما يصرّح المحوّل بكل قدرة تحتاجها الحمولة وخيارات التسليم.

| القدرة                 | صرّح بها عندما                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | يستطيع المحوّل إرسال نص وإعادة إيصال.                                                |
| `media`                | تعيد إرسالات الوسائط إيصالات لكل رسالة منصة مرئية.                                  |
| `payload`              | يحافظ المحوّل على دلالات حمولة الرد الغنية، وليس النص ورابط وسائط واحد فقط.          |
| `replyTo`              | تصل أهداف الرد الأصلية إلى المنصة.                                                   |
| `thread`               | تصل أهداف الخيط، أو الموضوع، أو خيط القناة الأصلية إلى المنصة.                       |
| `silent`               | يصل كبت الإشعارات إلى المنصة.                                                        |
| `nativeQuote`          | تصل بيانات الاقتباس المحدد الوصفية إلى المنصة.                                      |
| `messageSendingHooks`  | يمكن لخطافات إرسال الرسائل الأساسية إلغاء المحتوى أو إعادة كتابته قبل إدخال/إخراج المنصة. |
| `batch`                | يمكن إعادة تشغيل الدفعات المعروضة متعددة الأجزاء كخطة متينة واحدة.                   |
| `reconcileUnknownSend` | يستطيع المحوّل حل استرداد `unknown_after_send` من دون إعادة تشغيل عمياء.             |
| `afterSendSuccess`     | تعمل الآثار الجانبية المحلية للقناة بعد الإرسال مرة واحدة.                           |
| `afterCommit`          | تعمل الآثار الجانبية المحلية للقناة بعد التثبيت مرة واحدة.                           |

لا يتطلب التسليم النهائي بأفضل جهد `reconcileUnknownSend`؛ فهو يستخدم
دورة الحياة المشتركة عندما يحافظ المحوّل على الدلالات المرئية للحمولة، ويرجع
إلى إدخال/إخراج المنصة المباشر إذا لم يكن استمرار الطابور متاحا. يجب أن يتطلب
التسليم النهائي المتين المطلوب `reconcileUnknownSend` صراحة. إذا لم يستطع
المحوّل تحديد ما إذا كان إرسال بدأ/مجهول قد وصل إلى المنصة، فلا تصرّح بهذه القدرة؛
سيرفض القلب التسليم المتين المطلوب قبل الاصطفاف.

عندما يحتاج المستدعي إلى تسليم متين، اشتق المتطلبات بدلا من بناء الخرائط يدويا:

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

`messageSendingHooks` مطلوبة افتراضيا. عيّن `messageSendingHooks: false`
فقط لمسار لا يستطيع عمدا تشغيل خطافات إرسال الرسائل العامة.

## عقد الإرسال المتين

يحمل الإرسال النهائي المتين دلالات أكثر صرامة من التسليم القديم المملوك للقناة:

- أنشئ القصد المتين قبل إدخال/إخراج المنصة.
- إذا أعاد التسليم المتين نتيجة معالجة، فلا ترجع إلى الإرسال القديم.
- تعامل مع إلغاء الخطاف ونتائج عدم الإرسال على أنها نهائية.
- تعامل مع `unsupported` كنتيجة قبل القصد فقط.
- بالنسبة للمتانة المطلوبة، افشل قبل إدخال/إخراج المنصة إذا تعذر على الطابور تسجيل
  أن إرسال المنصة قد بدأ.
- بالنسبة للتسليم النهائي المطلوب وإرسالات أداة الرسائل المحضّرة المطلوبة،
  تحقق مسبقا من `reconcileUnknownSend`؛ يجب أن يكون الاسترداد قادرا على إقرار
  رسالة مرسلة بالفعل أو إعادة التشغيل فقط بعد أن يثبت المحوّل أن الإرسال الأصلي
  لم يحدث.
- بالنسبة إلى `best_effort`، قد ترجع إخفاقات كتابة الطابور إلى إدخال/إخراج المنصة المباشر.
- مرّر إشارات الإلغاء إلى تحميل الوسائط وإرسالات المنصة.
- شغّل خطافات ما بعد التثبيت بعد إقرار الطابور؛ يشغّل الرجوع المباشر بأفضل جهد هذه الخطافات
  بعد نجاح إدخال/إخراج المنصة لأنه لا يوجد تثبيت طابور متين.
- أعد إيصالات لكل معرّف رسالة منصة مرئية.
- استخدم `reconcileUnknownSend` عندما تستطيع منصة التحقق مما إذا كان إرسال غير مؤكد
  قد وصل بالفعل إلى المستخدم.

يتجنب هذا العقد الإرسالات المكررة بعد الأعطال، ويتجنب تجاوز
خطافات إلغاء إرسال الرسائل.

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

استخدم `createMessageReceiptFromOutboundResults(...)` عند تكييف نتيجة إرسال موجودة. استخدم `createPreviewMessageReceipt(...)` عندما تصبح رسالة معاينة مباشرة هي إيصال الاستلام النهائي. تجنّب إضافة حقول `messageIds` جديدة محلية للمالك. لا يزال `ChannelDeliveryResult.messageIds` القديم يُنتَج عند حواف التوافق.

## المعاينة المباشرة

ينبغي للقنوات التي تبث معاينات مسودات أو تحديثات تقدم أن تعلن القدرات المباشرة:

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
`deliverWithFinalizableLivePreviewAdapter(...)` للإكمال النهائي وقت التشغيل. يقرر المُكمِّل النهائي ما إذا كان الرد النهائي سيعدّل المعاينة في مكانها، أو يرسل بديلاً عادياً، أو يتخلص من حالة المعاينة المعلّقة، أو يحتفظ بتعديل فاشل ملتبس من دون تكرار الرسالة، ويعيد إيصال الاستلام النهائي.

## سياسة إقرار الاستلام

ينبغي لمستقبِلات الرسائل الواردة التي تتحكم في توقيت إقرار الاستلام على المنصة أن تعلن سياسة الاستلام:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

المحوّلات التي لا تعلن سياسة استلام تعتمد افتراضياً على:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

استخدم الإعداد الافتراضي عندما لا يكون لدى المنصة إقرار استلام يمكن تأجيله، أو عندما تقرّ بالاستلام بالفعل قبل المعالجة غير المتزامنة، أو عندما تحتاج إلى دلالات استجابة خاصة بالبروتوكول. أعلن إحدى السياسات المرحلية فقط عندما يستخدم المستقبِل فعلياً سياق الاستلام لتأخير إقرار الاستلام على المنصة.

السياسات:

| السياسة                | استخدمها عندما                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| `after_receive_record` | يمكن إقرار المنصة بعد تحليل الحدث الوارد وتسجيله.                              |
| `after_agent_dispatch` | ينبغي للمنصة الانتظار حتى يتم قبول إرسال الوكيل.                               |
| `after_durable_send`   | ينبغي للمنصة الانتظار حتى يكون للتسليم النهائي قرار دائم.                      |
| `manual`               | يملك Plugin إقرار الاستلام لأن دلالات المنصة لا تطابق مرحلة عامة.              |

استخدم `createMessageReceiveContext(...)` في المستقبِلات التي تؤجل حالة الإقرار، و
`shouldAckMessageAfterStage(...)` عندما يحتاج المستقبِل إلى اختبار ما إذا كانت مرحلة ما قد استوفت السياسة المضبوطة.

## اختبارات العقد

إعلانات القدرات جزء من عقد Plugin. ادعمها بالاختبارات:

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

أضف مجموعات إثبات للمعاينة المباشرة والاستلام عندما يعلن المحوّل تلك الميزات. ينبغي أن يؤدي غياب الإثبات إلى فشل الاختبار بدلاً من توسيع السطح الدائم بصمت.

## واجهات API التوافق المهملة

تبقى واجهات API هذه قابلة للاستيراد لتوافق الأطراف الثالثة. لا تستخدمها في كود القنوات الجديد.

| واجهة API المهملة                            | البديل                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` لمرسِلات التوافق، أو محوّل `message` لكود القنوات الجديد                          |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` مع `channel.turn.runPrepared(...)`، أو محوّل `message` لكود القنوات الجديد        |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` مع `channel.turn.runPrepared(...)`، أو محوّل `message` لكود القنوات الجديد        |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` مع `channel.turn.runPrepared(...)`، أو محوّل `message` لكود القنوات الجديد        |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` أو `deliverInboundReplyWithMessageSendContext(...)` من `channel-message-runtime`            |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` من `openclaw/plugin-sdk/channel-message-runtime`                          |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` مع `channel.turn.runPrepared(...)`، أو محوّل `message` لكود القنوات الجديد        |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` مع `channel.turn.runPrepared(...)`، أو محوّل `message` لكود القنوات الجديد        |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` مع `deliverWithFinalizableLivePreviewAdapter(...)`                              |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

لا يزال بإمكان مرسِلات التوافق استخدام `createReplyPrefixContext(...)`،
و`createReplyPrefixOptions(...)`، و`createTypingCallbacks(...)` عبر واجهة الرسائل. ينبغي لكود دورة الحياة الجديد تجنّب المسار الفرعي القديم `channel-reply-pipeline`.

## قائمة تحقق الترحيل

1. أضف `message: defineChannelMessageAdapter(...)` أو
   `message: createChannelMessageAdapterFromOutbound(...)` إلى Plugin القناة.
2. أعد `MessageReceipt` من عمليات إرسال النص والوسائط والحمولات.
3. أعلن فقط القدرات المدعومة بسلوك أصلي واختبارات.
4. استبدل خرائط المتطلبات الدائمة المكتوبة يدوياً بـ
   `deriveDurableFinalDeliveryRequirements(...)`.
5. انقل الإكمال النهائي للمعاينة عبر مساعدات المعاينة المباشرة عندما تعدّل القناة رسائل المسودة في مكانها.
6. أعلن سياسة إقرار الاستلام فقط عندما يستطيع المستقبِل فعلاً تأجيل إقرار الاستلام على المنصة.
7. أبقِ مساعدات إرسال الردود القديمة عند حواف التوافق فقط.

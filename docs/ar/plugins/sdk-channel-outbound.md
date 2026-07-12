---
read_when:
    - أنت تبني أو تعيد هيكلة مسار الإرسال في Plugin لقناة مراسلة
    - تحتاج إلى تسليم نهائي موثوق للرد، أو إيصالات، أو إنهاء المعاينة المباشرة، أو سياسة إقرار بالاستلام
    - أنت تنتقل من مساعدات إرسال الردود القديمة أو `channel-message-runtime` أو `channel-message`
summary: 'واجهة برمجة تطبيقات دورة حياة الرسائل الصادرة لملحقات القنوات: المحوّلات، وإيصالات الاستلام، وعمليات الإرسال الدائمة، والمعاينة المباشرة، وأدوات مساعدة مسار الردود'
title: واجهة برمجة التطبيقات الصادرة للقناة
x-i18n:
    generated_at: "2026-07-12T06:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

تعرض Plugins القنوات سلوك الرسائل الصادرة من
`openclaw/plugin-sdk/channel-outbound`. استخدم
`openclaw/plugin-sdk/channel-inbound` لتنسيق
الاستقبال/السياق/الإرسال.

تتولى النواة الاصطفاف، والاستمرارية، وسياسة إعادة المحاولة العامة، والخطافات، والإيصالات،
وأداة `message` المشتركة. ويتولى Plugin استدعاءات الإرسال/التحرير/الحذف الأصلية،
وتوحيد الوجهة، وسلاسل المحادثات الخاصة بالمنصة، والاقتباسات المحددة، وأعلام الإشعارات،
وحالة الحساب، والآثار الجانبية الخاصة بالمنصة.

## المحوّل

تعرّف معظم Plugins محوّل `message` واحدًا:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

صرّح فقط بالإمكانات التي يحافظ عليها النقل الأصلي فعليًا. غطِّ
كل إمكانية معلنة للإرسال، والإيصال، والمعاينة المباشرة، وإقرار الاستلام
باستخدام مساعدات العقد المصدّرة من هذا المسار الفرعي.

## تنقية النص العادي

استخدم `sanitizeForPlainText(...)` عندما يحتاج محوّل صادر إلى تحويل
وسوم تنسيق HTML المدعومة إلى ترميز نصي خفيف. يحافظ الإعداد الافتراضي على
علامات الخط العريض والشطب الحالية بأسلوب الدردشة. مرّر
`{ style: "markdown" }` فقط عندما تعيد القناة تحليل الناتج بوصفه Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

يستخدم نمط Markdown العلامتين `**bold**` و`~~strikethrough~~`؛ بينما يحتفظ الخط المائل
والكود المضمّن بعلامات `_italic_` وعلامات الشرطة المائلة العكسية في كلا النمطين. حدّد النمط عند
حدود القناة بدلًا من إعادة كتابة نص العلامات بعد التنقية.

## أدلة التسليم

يسجّل `MessageReceipt` النتيجة التي يعيدها محوّل القناة. تُظهر
معرّفات رسائل المنصة الفعلية أن مسار إرسال المنصة قد قبل
الرسالة؛ لكنها لا تثبت أن جهاز المستلم عرضها أو قرأها.
الإيصالات التي لا تتضمن معرّفات رسائل المنصة ليست سوى بيانات وصفية محلية للإيصال.
ينبغي للقنوات التي تدعم إيصالات القراءة أو حالة التسليم إلى الجهاز تتبّع هذه الحقائق
عبر مسار منفصل خاص بالقناة.

إذا كان بإمكان محوّل القناة إثبات أن إعادة محاولة عملية فاشلة لا يمكن أن تكرر
إرسالًا مرئيًا للمستلم، وأنه لم يبدأ أي استدعاء قادر على الإنهاء، فألقِ
`new PlatformMessageNotDispatchedError("...", { cause: error })` من
`openclaw/plugin-sdk/error-runtime`. يمكن للنواة حينها مسح أدلة محاولة الإرسال
القديمة وإعادة محاولة القصد الموجود في قائمة الانتظار بأمان. لا يجوز إجراء هذا التأكيد إلا للمحوّل الذي يملك
حد الإرسال النهائي. لا تستخدم العلامة مطلقًا بعد بدء استدعاء
الإنهاء/الإرسال أو إذا أعاد نتيجة ملتبسة؛ فقد يؤدي وضع علامة خاطئة إلى
تكرار الرسائل.

## محوّلات الإرسال الصادر الحالية

إذا كانت القناة تتضمن بالفعل محوّل `outbound` متوافقًا، فاشتق
محوّل الرسائل بدلًا من تكرار كود الإرسال:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## عمليات الإرسال المستدامة

توجد أيضًا مساعدات الإرسال وقت التشغيل في `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- مساعدات بث المسودة/التقدم مثل `resolveChannelDraftStreamingChunking(...)`

تعيد `sendDurableMessageBatch(...)` نتيجة صريحة واحدة:

| النتيجة          | المعنى                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | قبل مسار إرسال المنصة رسالة مرئية واحدة على الأقل في المنصة                            |
| `suppressed`     | لا ينبغي اعتبار أي رسالة في المنصة مفقودة                                               |
| `partial_failed` | قُبلت رسالة واحدة على الأقل في المنصة قبل فشل حمولة لاحقة أو أثر جانبي                 |
| `failed`         | لم يُنتج أي إيصال من المنصة                                                             |

استخدم `payloadOutcomes` عندما تجمع دفعة بين حمولات مرسلة ومُلغاة وفاشلة.
لا تستنتج إلغاء الخطاف من نتيجة تسليم مباشر قديمة فارغة.

## قبول التسليم المؤجل

استخدم `message.durableFinal.admitDeferredDelivery(...)` عندما يتعذر على حساب محلول
قبول التسليم الصادر أو المؤجل الذي تديره النواة بأمان. تستدعي النواة
هذا الخطاف تزامنيًا قبل العمل الصادر المباشر، بما في ذلك المسارات التي تتخطى
استمرارية قائمة الانتظار، ومرة أخرى قبل إعادة تشغيل قصد مستعاد. يتضمن السياق
`cfg` و`channel` و`to` و`accountId`، و`phase` بقيمة `live` أو
`recovery`.

أعِد `{ status: "allowed" }` للمتابعة. أعِد
`{ status: "permanent_rejection", reason }` عندما يجب عدم حفظ التسليم
أو إرساله مباشرة أو إعادة تشغيله. يفشل الرفض المباشر قبل إنشاء قائمة الانتظار
أو خطافات الرسائل أو عمل المنصة. يضع رفض الاستعادة علامة الفشل على
السجل الموجود في قائمة الانتظار ويتخطى التسوية وإعادة التشغيل. يعني حذف الخطاف
السماح.

الخطاف قرار قبول تزامني، وليس مسار إرسال. اقرأ فقط
الإعدادات المحمّلة مسبقًا أو حالة وقت التشغيل؛ ولا تنفّذ عمليات إدخال/إخراج غير متزامنة
عبر الشبكة أو نظام الملفات أو غيرهما. ينبغي لاختبارات العقد اختبار كلتا المرحلتين وكلا
نوعي النتائج من خلال `ChannelMessageDurableFinalAdapter` من
`openclaw/plugin-sdk/channel-outbound`.

## إرسال التوافق

أنشئ إرسال الردود الواردة عبر `dispatchChannelInboundReply(...)`
من `channel-inbound`. أبقِ تسليم المنصة في محوّل التسليم؛ واستخدم
`channel-outbound` لمحوّلات الرسائل، وعمليات الإرسال المستدامة، والإيصالات، والمعاينة
المباشرة، وخيارات مسار معالجة الردود.

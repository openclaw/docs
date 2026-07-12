---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم كيفية اختلاف تفاعلات الرموز التعبيرية بين المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-07-12T06:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

يضيف الوكيل تفاعلات الرموز التعبيرية ويزيلها باستخدام الإجراء `react` لأداة `message`. يختلف السلوك باختلاف القناة.

## كيفية العمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- يكون `emoji` مطلوبًا عند إضافة تفاعل.
- عيّن `emoji` إلى سلسلة فارغة (`""`) لإزالة تفاعل (تفاعلات) البوت على القنوات التي تدعم ذلك.
- عيّن `remove: true` لإزالة رمز تعبيري محدد واحد (يتطلب قيمة `emoji` غير فارغة).
- في القنوات التي تستخدم تفاعلات الحالة، يتيح تعيين `trackToolCalls: true` في تفاعل لبيئة التشغيل إعادة استخدام الرسالة التي أُضيف إليها التفاعل لإضافة تفاعلات لاحقة تشير إلى تقدم الأداة أثناء الدور نفسه.

## سلوك القنوات

<AccordionGroup>
  <Accordion title="Discord وSlack">
    - تزيل قيمة `emoji` الفارغة جميع تفاعلات البوت على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - إضافة التفاعلات فقط: يكون `emoji` مطلوبًا ويجب ألا يكون فارغًا.
    - لم تُربط إزالة التفاعل بعدُ باستدعاء حذف؛ يُرفض `remove: true` بخطأ صريح بدلًا من عدم تنفيذ أي إجراء بصمت.
    - يتطلب تسجيل بوت Talk مع ميزة `reaction` (راجع [توثيق قناة Nextcloud Talk](/ar/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - تزيل قيمة `emoji` الفارغة تفاعلات البوت.
    - يزيل `remove: true` التفاعلات أيضًا، لكنه يظل يتطلب قيمة `emoji` غير فارغة للتحقق من صحة استدعاء الأداة.

  </Accordion>

  <Accordion title="WhatsApp">
    - تزيل قيمة `emoji` الفارغة تفاعل البوت.
    - يُحوَّل `remove: true` داخليًا إلى رمز تعبيري فارغ (مع استمرار اشتراط `emoji` في استدعاء الأداة).
    - لدى WhatsApp خانة واحدة لتفاعل البوت لكل رسالة؛ يؤدي إرسال تفاعل جديد إلى استبداله بدلًا من تكديس عدة رموز تعبيرية.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب قيمة `emoji` غير فارغة لكل من الإضافة والإزالة.
    - يزيل `remove: true` تفاعل الرمز التعبيري المحدد.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - يستخدم الإجراء `react` نفسه الذي تستخدمه القنوات الأخرى (الإضافة والإزالة والسرد عبر معرّفات تفاعلات الرسائل)، وليس أداة منفصلة.
    - تتطلب الإضافة قيمة `emoji` غير فارغة (تُحوَّل إلى `emoji_type` في Feishu، مثل `SMILE` و`THUMBSUP` و`HEART`).
    - يتطلب `remove: true` قيمة `emoji` غير فارغة، ويزيل تفاعل البوت المطابق لنوع ذلك الرمز التعبيري.
    - تؤدي قيمة `emoji` الفارغة مع `clearAll: true` إلى إزالة جميع تفاعلات البوت على الرسالة.

  </Accordion>

  <Accordion title="Signal">
    - تتحكم `channels.signal.reactionNotifications` في إشعارات التفاعلات الواردة: يعطّلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع رسائل البوت، ويصدر `"all"` أحداثًا لجميع التفاعلات، بينما يصدر `"allowlist"` أحداثًا فقط للمرسلين الموجودين في `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - التفاعلات الصادرة هي ردود النقر في iMessage (`love` و`like` و`dislike` و`laugh` و`emphasize` و`question`)؛ ويجب أن تتطابق قيمة `emoji` مع أحد هذه الأنواع لإضافة تفاعل.
    - يزيل `remove: true` من دون نوع رد نقر معروف جميع أنواع ردود النقر؛ أما مع نوع معروف، فيزيل ذلك النوع فقط.

  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يحدّد `reactionLevel` لكل قناة معدل إرسال الوكيل لتفاعلاته الخاصة. القيم: `off` أو `ack` أو `minimal` أو `extensive`.

- [إشعارات التفاعلات في Telegram](/ar/channels/telegram#feature-reference) - ‏`channels.telegram.reactionLevel` (الافتراضي `minimal`)
- [مستوى التفاعل في WhatsApp](/ar/channels/whatsapp#reaction-level) - ‏`channels.whatsapp.reactionLevel` (الافتراضي `minimal`)
- [التفاعلات في Signal](/ar/channels/signal#reactions-message-tool) - ‏`channels.signal.reactionLevel` (الافتراضي `minimal`)

## ذو صلة

- [إرسال الوكيل](/ar/tools/agent-send) - أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) - إعدادات خاصة بكل قناة

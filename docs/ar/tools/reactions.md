---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم كيفية اختلاف تفاعلات الرموز التعبيرية عبر المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-06-27T18:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

يمكن للوكيل إضافة تفاعلات الرموز التعبيرية وإزالتها على الرسائل باستخدام أداة `message`
مع إجراء `react`. يختلف سلوك التفاعل حسب القناة والنقل.

## طريقة العمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- يكون `emoji` مطلوبًا عند إضافة تفاعل.
- اضبط `emoji` على سلسلة فارغة (`""`) لإزالة تفاعل/تفاعلات البوت.
- اضبط `remove: true` لإزالة رمز تعبيري محدد (يتطلب `emoji` غير فارغ).
- في القنوات التي تدعم تفاعلات الحالة، يتيح `trackToolCalls: true` على
  التفاعل لوقت التشغيل استخدام تلك الرسالة المتفاعل معها لتفاعلات تقدم الأدوات
  اللاحقة خلال الدور نفسه.

## سلوك القناة

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - يزيل `emoji` الفارغ كل تفاعلات البوت على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Google Chat">
    - يزيل `emoji` الفارغ تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - إضافة التفاعلات فقط: يكون `emoji` مطلوبًا ويجب ألا يكون فارغًا.
    - إزالة التفاعلات غير مدعومة بعد؛ تُرفض الاستدعاءات مع `remove: true` (أو `emoji` فارغ) بخطأ واضح بدلًا من تجاهلها بصمت بلا أثر.
    - يتطلب تسجيل بوت Talk بميزة `reaction` (راجع [وثائق قناة Nextcloud Talk](/ar/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - يزيل `emoji` الفارغ تفاعلات البوت.
    - يزيل `remove: true` التفاعلات أيضًا لكنه لا يزال يتطلب `emoji` غير فارغ للتحقق من صحة الأداة.

  </Accordion>

  <Accordion title="WhatsApp">
    - يزيل `emoji` الفارغ تفاعل البوت.
    - يُطابِق `remove: true` داخليًا إلى رمز تعبيري فارغ (مع استمرار طلب `emoji` في استدعاء الأداة).
    - لدى WhatsApp خانة تفاعل بوت واحدة لكل رسالة؛ تستبدل تحديثات تفاعل الحالة تلك الخانة بدلًا من تكديس عدة رموز تعبيرية.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغ.
    - يزيل `remove: true` تفاعل الرمز التعبيري المحدد ذاك.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم أداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - تتطلب الإضافة/الإزالة `emoji_type`؛ وتتطلب الإزالة أيضًا `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - تتحكم `channels.signal.reactionNotifications` في إشعارات التفاعلات الواردة: يعطلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع رسائل البوت، ويصدر `"all"` أحداثًا لكل التفاعلات.

  </Accordion>

  <Accordion title="iMessage">
    - التفاعلات الصادرة هي tapbacks في iMessage (`love` و`like` و`dislike` و`laugh` و`emphasize` و`question`).
    - تتحكم `channels.imessage.reactionNotifications` في إشعارات tapback الواردة: يعطلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع الرسائل التي ألّفها البوت، ويصدر `"all"` أحداثًا لكل tapbacks من المرسلين المصرح لهم.

  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى اتساع استخدام الوكيل للتفاعلات. تكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [Telegram reactionLevel](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

اضبط `reactionLevel` على القنوات الفردية لضبط مدى نشاط تفاعل الوكيل مع الرسائل على كل منصة.

## ذات صلة

- [إرسال الوكيل](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — إعداد خاص بكل قناة

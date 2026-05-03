---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم كيفية اختلاف تفاعلات الرموز التعبيرية عبر المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-05-03T21:43:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

يمكن للوكيل إضافة تفاعلات الرموز التعبيرية وإزالتها على الرسائل باستخدام أداة `message`
مع الإجراء `react`. يختلف سلوك التفاعلات حسب القناة ووسيلة النقل.

## كيف يعمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- تكون `emoji` مطلوبة عند إضافة تفاعل.
- عيّن `emoji` إلى سلسلة فارغة (`""`) لإزالة تفاعل/تفاعلات البوت.
- عيّن `remove: true` لإزالة رمز تعبيري محدد (يتطلب `emoji` غير فارغة).
- في القنوات التي تدعم تفاعلات الحالة، يتيح `trackToolCalls: true` على
  تفاعل لوقت التشغيل استخدام تلك الرسالة المتفاعل معها لتفاعلات تقدم الأدوات
  اللاحقة خلال نفس الدور.

## سلوك القناة

<AccordionGroup>
  <Accordion title="Discord وSlack">
    - تزيل `emoji` الفارغة كل تفاعلات البوت على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Google Chat">
    - تزيل `emoji` الفارغة تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Telegram">
    - تزيل `emoji` الفارغة تفاعلات البوت.
    - يزيل `remove: true` التفاعلات أيضًا، لكنه لا يزال يتطلب `emoji` غير فارغة للتحقق من صحة الأداة.

  </Accordion>

  <Accordion title="WhatsApp">
    - تزيل `emoji` الفارغة تفاعل البوت.
    - يُحوَّل `remove: true` داخليًا إلى رمز تعبيري فارغ (مع بقاء `emoji` مطلوبة في استدعاء الأداة).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغة.
    - يزيل `remove: true` تفاعل ذلك الرمز التعبيري المحدد.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم أداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - تتطلب الإضافة/الإزالة `emoji_type`؛ وتتطلب الإزالة أيضًا `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - تتحكم `channels.signal.reactionNotifications` في إشعارات التفاعلات الواردة: يعطّلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع رسائل البوت، ويصدر `"all"` أحداثًا لكل التفاعلات.

  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى اتساع استخدام الوكيل للتفاعلات. تكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [Telegram reactionLevel](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

عيّن `reactionLevel` على القنوات الفردية لضبط مدى نشاط تفاعل الوكيل مع الرسائل على كل منصة.

## ذات صلة

- [إرسال الوكيل](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — الإعدادات الخاصة بكل قناة

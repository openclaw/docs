---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم كيفية اختلاف تفاعلات الرموز التعبيرية عبر المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-04-30T08:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

يمكن للوكيل إضافة تفاعلات الرموز التعبيرية وإزالتها على الرسائل باستخدام أداة `message`
مع الإجراء `react`. يختلف سلوك التفاعل حسب القناة ووسيلة النقل.

## كيف يعمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` مطلوب عند إضافة تفاعل.
- اضبط `emoji` على سلسلة فارغة (`""`) لإزالة تفاعل/تفاعلات البوت.
- اضبط `remove: true` لإزالة رمز تعبيري محدد (يتطلب `emoji` غير فارغ).

## سلوك القنوات

<AccordionGroup>
  <Accordion title="Discord وSlack">
    - يزيل `emoji` الفارغ كل تفاعلات البوت على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Google Chat">
    - يزيل `emoji` الفارغ تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.

  </Accordion>

  <Accordion title="Telegram">
    - يزيل `emoji` الفارغ تفاعلات البوت.
    - يزيل `remove: true` التفاعلات أيضًا، لكنه ما يزال يتطلب `emoji` غير فارغ للتحقق من صحة الأداة.

  </Accordion>

  <Accordion title="WhatsApp">
    - يزيل `emoji` الفارغ تفاعل البوت.
    - يُربط `remove: true` داخليًا برمز تعبيري فارغ (ما يزال يتطلب `emoji` في استدعاء الأداة).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغ.
    - يزيل `remove: true` تفاعل ذلك الرمز التعبيري المحدد.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم أداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - تتطلب الإضافة/الإزالة `emoji_type`؛ وتتطلب الإزالة أيضًا `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - تتحكم `channels.signal.reactionNotifications` في إشعارات التفاعلات الواردة: يعطلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع رسائل البوت، ويصدر `"all"` أحداثًا لكل التفاعلات.

  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى اتساع استخدام الوكيل للتفاعلات. تكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [مستوى التفاعل في Telegram](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [مستوى التفاعل في WhatsApp](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

اضبط `reactionLevel` على القنوات الفردية لتخصيص مدى نشاط تفاعل الوكيل مع الرسائل على كل منصة.

## ذو صلة

- [إرسال الوكيل](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — إعدادات خاصة بالقنوات

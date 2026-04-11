---
read_when:
    - أنت تعمل على التفاعلات في أي قناة
    - أنت تريد فهم كيفية اختلاف تفاعلات الرموز التعبيرية بين المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-04-11T02:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# التفاعلات

يمكن للعامل إضافة تفاعلات الرموز التعبيرية إلى الرسائل وإزالتها باستخدام أداة `message`
مع الإجراء `react`. ويختلف سلوك التفاعلات حسب القناة.

## كيف يعمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- يكون `emoji` مطلوبًا عند إضافة تفاعل.
- عيّن `emoji` إلى سلسلة فارغة (`""`) لإزالة تفاعل (أو تفاعلات) الروبوت.
- عيّن `remove: true` لإزالة رمز تعبيري محدد (ويتطلب `emoji` غير فارغ).

## سلوك القنوات

<AccordionGroup>
  <Accordion title="Discord وSlack">
    - يزيل `emoji` الفارغ جميع تفاعلات الروبوت على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.
  </Accordion>

  <Accordion title="Google Chat">
    - يزيل `emoji` الفارغ تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` الرمز التعبيري المحدد فقط.
  </Accordion>

  <Accordion title="Telegram">
    - يزيل `emoji` الفارغ تفاعلات الروبوت.
    - يزيل `remove: true` التفاعلات أيضًا، لكنه لا يزال يتطلب `emoji` غير فارغ للتحقق من الأداة.
  </Accordion>

  <Accordion title="WhatsApp">
    - يزيل `emoji` الفارغ تفاعل الروبوت.
    - يُحوَّل `remove: true` داخليًا إلى رمز تعبيري فارغ (مع أنه لا يزال يتطلب `emoji` في استدعاء الأداة).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغ.
    - يزيل `remove: true` تفاعل هذا الرمز التعبيري المحدد.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم الأداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - تتطلب الإضافة/الإزالة `emoji_type`؛ كما تتطلب الإزالة أيضًا `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - يتم التحكم في إشعارات التفاعلات الواردة بواسطة `channels.signal.reactionNotifications`: يؤدي `"off"` إلى تعطيلها، ويؤدي `"own"` (الافتراضي) إلى إصدار أحداث عندما يتفاعل المستخدمون مع رسائل الروبوت، ويؤدي `"all"` إلى إصدار أحداث لجميع التفاعلات.
  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى اتساع استخدام العامل للتفاعلات. وتكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [مستوى التفاعل في Telegram](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [مستوى التفاعل في WhatsApp](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

عيّن `reactionLevel` على القنوات الفردية لضبط مدى نشاط العامل في التفاعل مع الرسائل على كل منصة.

## ذو صلة

- [إرسال العامل](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — إعدادات خاصة بكل قناة

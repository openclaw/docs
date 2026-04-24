---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم اختلاف تفاعلات emoji عبر المنصات
summary: دلالات أداة التفاعلات عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-04-24T08:10:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

يمكن للوكيل إضافة تفاعلات emoji وإزالتها على الرسائل باستخدام أداة `message`
مع الإجراء `react`. ويختلف سلوك التفاعلات حسب القناة.

## كيف يعمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- الحقل `emoji` مطلوب عند إضافة تفاعل.
- اضبط `emoji` على سلسلة فارغة (`""`) لإزالة تفاعل/تفاعلات الروبوت.
- اضبط `remove: true` لإزالة emoji محدد (يتطلب `emoji` غير فارغ).

## سلوك القنوات

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - تؤدي قيمة `emoji` الفارغة إلى إزالة جميع تفاعلات الروبوت على الرسالة.
    - يزيل `remove: true` قيمة emoji المحددة فقط.
  </Accordion>

  <Accordion title="Google Chat">
    - تؤدي قيمة `emoji` الفارغة إلى إزالة تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` قيمة emoji المحددة فقط.
  </Accordion>

  <Accordion title="Telegram">
    - تؤدي قيمة `emoji` الفارغة إلى إزالة تفاعلات الروبوت.
    - يزيل `remove: true` التفاعلات أيضًا، لكنه ما يزال يتطلب `emoji` غير فارغ للتحقق من الأداة.
  </Accordion>

  <Accordion title="WhatsApp">
    - تؤدي قيمة `emoji` الفارغة إلى إزالة تفاعل الروبوت.
    - يتم ربط `remove: true` داخليًا بـ emoji فارغة (مع أنه ما يزال يتطلب `emoji` في استدعاء الأداة).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغ.
    - يزيل `remove: true` تفاعل emoji المحدد هذا.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم أداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - يتطلب الإجراءان add/remove الحقل `emoji_type`؛ كما يتطلب remove أيضًا `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - يتم التحكم في إشعارات التفاعلات الواردة بواسطة `channels.signal.reactionNotifications`: تؤدي القيمة `"off"` إلى تعطيلها، وتؤدي `"own"` ‏(الافتراضي) إلى إصدار أحداث عندما يتفاعل المستخدمون مع رسائل الروبوت، وتؤدي `"all"` إلى إصدار أحداث لجميع التفاعلات.
  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى استخدام الوكيل للتفاعلات. وتكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [مستوى reactionLevel في Telegram](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [مستوى reactionLevel في WhatsApp](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

اضبط `reactionLevel` على القنوات الفردية لتحديد مدى نشاط الوكيل في التفاعل مع الرسائل على كل منصة.

## ذو صلة

- [Agent Send](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — إعدادات خاصة بكل قناة

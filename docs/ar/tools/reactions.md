---
read_when:
    - العمل على التفاعلات في أي قناة
    - فهم كيفية اختلاف تفاعلات الرموز التعبيرية عبر المنصات
summary: دلالات أداة التفاعل عبر جميع القنوات المدعومة
title: التفاعلات
x-i18n:
    generated_at: "2026-05-12T01:01:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

يمكن للوكيل إضافة تفاعلات emoji وإزالتها على الرسائل باستخدام أداة `message`
مع الإجراء `react`. يختلف سلوك التفاعلات حسب القناة ووسيلة النقل.

## آلية العمل

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- يكون `emoji` مطلوبًا عند إضافة تفاعل.
- عيّن `emoji` إلى سلسلة فارغة (`""`) لإزالة تفاعل/تفاعلات البوت.
- عيّن `remove: true` لإزالة emoji محدد (يتطلب `emoji` غير فارغ).
- في القنوات التي تدعم تفاعلات الحالة، يتيح `trackToolCalls: true` على
  التفاعل لبيئة التشغيل استخدام تلك الرسالة المتفاعَل معها لتفاعلات تقدم
  الأدوات اللاحقة أثناء الدور نفسه.

## سلوك القنوات

<AccordionGroup>
  <Accordion title="Discord و Slack">
    - يزيل `emoji` الفارغ كل تفاعلات البوت على الرسالة.
    - يزيل `remove: true` فقط emoji المحدد.

  </Accordion>

  <Accordion title="Google Chat">
    - يزيل `emoji` الفارغ تفاعلات التطبيق على الرسالة.
    - يزيل `remove: true` فقط emoji المحدد.

  </Accordion>

  <Accordion title="Telegram">
    - يزيل `emoji` الفارغ تفاعلات البوت.
    - يزيل `remove: true` التفاعلات أيضًا لكنه لا يزال يتطلب `emoji` غير فارغ للتحقق من صحة الأداة.

  </Accordion>

  <Accordion title="WhatsApp">
    - يزيل `emoji` الفارغ تفاعل البوت.
    - يُطابَق `remove: true` مع emoji فارغ داخليًا (ولا يزال يتطلب `emoji` في استدعاء الأداة).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - يتطلب `emoji` غير فارغ.
    - يزيل `remove: true` تفاعل emoji المحدد ذلك.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - استخدم أداة `feishu_reaction` مع الإجراءات `add` و`remove` و`list`.
    - تتطلب الإضافة/الإزالة `emoji_type`؛ وتتطلب الإزالة أيضًا `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - يتم التحكم في إشعارات التفاعلات الواردة بواسطة `channels.signal.reactionNotifications`: يعطلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع رسائل البوت، ويصدر `"all"` أحداثًا لكل التفاعلات.

  </Accordion>

  <Accordion title="iMessage">
    - تكون التفاعلات الصادرة عبارة عن tapbacks في iMessage (`love` و`like` و`dislike` و`laugh` و`emphasize` و`question`).
    - يتم التحكم في إشعارات tapback الواردة بواسطة `channels.imessage.reactionNotifications`: يعطلها `"off"`، ويصدر `"own"` (الافتراضي) أحداثًا عندما يتفاعل المستخدمون مع الرسائل التي كتبها البوت، ويصدر `"all"` أحداثًا لكل tapbacks من المرسلين المصرح لهم.

  </Accordion>
</AccordionGroup>

## مستوى التفاعل

يتحكم إعداد `reactionLevel` لكل قناة في مدى استخدام الوكيل للتفاعلات. تكون القيم عادةً `off` أو `ack` أو `minimal` أو `extensive`.

- [Telegram reactionLevel](/ar/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ar/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

عيّن `reactionLevel` على القنوات الفردية لضبط مدى نشاط تفاعل الوكيل مع الرسائل على كل منصة.

## ذو صلة

- [إرسال الوكيل](/ar/tools/agent-send) — أداة `message` التي تتضمن `react`
- [القنوات](/ar/channels) — إعداد خاص بكل قناة
